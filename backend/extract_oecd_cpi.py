"""Extract monthly headline CPI from the OECD SDMX Prices dataflow.

Pulls YoY % (PA/GY) and index (IX/_Z) for an allowlist of REF_AREA codes,
writes a single CSV consumed by load_oecd_cpi.py.

Usage:
    python extract_oecd_cpi.py
    python extract_oecd_cpi.py --areas AUS,USA,GBR
    python extract_oecd_cpi.py --dry-run
    python extract_oecd_cpi.py --start 2000-01
"""

from __future__ import annotations

import argparse
import logging
import time
from io import StringIO
from pathlib import Path

import pandas as pd
import requests

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)

OUT_CSV = Path(__file__).resolve().parent / "data" / "oecd_cpi_observations.csv"

DEFAULT_AREAS = [
    "ARG", "AUS", "BRA", "CAN", "CHN", "COL", "DEU", "GBR",
    "IDN", "IND", "ISR", "KOR", "USA",
    "OECD", "G7", "G20",
]

BASE_URL = (
    "https://sdmx.oecd.org/public/rest/data/"
    "OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL"
)

# Key: REF_AREA.FREQ.METHODOLOGY.MEASURE.UNIT_MEASURE.EXPENDITURE.ADJUSTMENT.TRANSFORMATION
SERIES = [
    # YoY % change
    {"unit_measure": "PA", "transform": "GY", "label": "YoY %"},
    # Index
    {"unit_measure": "IX", "transform": "_Z", "label": "Index"},
]

USER_AGENT = "Mozilla/5.0 (compatible; aus-cpi-etl/1.0; +https://github.com/aus-cpi)"
MAX_RETRIES = 6
BACKOFF_BASE = 5  # seconds


def build_url(areas: list[str], unit_measure: str, transform: str, start: str) -> str:
    area_key = "+".join(areas)
    key = f"{area_key}.M.N.CPI.{unit_measure}._T.N.{transform}"
    return (
        f"{BASE_URL}/{key}"
        f"?startPeriod={start}&dimensionAtObservation=AllDimensions"
        f"&format=csvfilewithlabels"
    )


def fetch_csv(url: str) -> str:
    headers = {"User-Agent": USER_AGENT, "Accept": "text/csv,*/*"}
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logging.info(f"GET {url} (attempt {attempt})")
            resp = requests.get(url, headers=headers, timeout=120)
            if resp.status_code == 429:
                wait = BACKOFF_BASE * (2 ** (attempt - 1))
                logging.warning(f"429 Too Many Requests — sleeping {wait}s")
                time.sleep(wait)
                continue
            if resp.status_code == 404:
                logging.warning(f"404 Not Found for {url}")
                return ""
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as exc:
            last_err = exc
            wait = BACKOFF_BASE * (2 ** (attempt - 1))
            logging.warning(f"Request failed ({exc}); sleeping {wait}s")
            time.sleep(wait)
    raise RuntimeError(f"Failed after {MAX_RETRIES} attempts: {last_err}")


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Map OECD labelled CSV columns to our load schema."""
    if df.empty:
        return df

    rename = {
        "REF_AREA": "country_code",
        "Reference area": "country_name",
        "FREQ": "frequency",
        "METHODOLOGY": "methodology",
        "MEASURE": "measure",
        "UNIT_MEASURE": "unit_measure",
        "EXPENDITURE": "expenditure",
        "ADJUSTMENT": "adjustment",
        "TRANSFORMATION": "transform",
        "TIME_PERIOD": "period",
        "OBS_VALUE": "value",
        "BASE_PER": "base_period",
    }
    missing = [c for c in rename if c not in df.columns]
    if missing:
        raise ValueError(f"Unexpected OECD CSV columns; missing {missing}. Got: {list(df.columns)}")

    out = df[list(rename.keys())].rename(columns=rename)
    out = out[out["value"].notna()].copy()
    out["period"] = out["period"].astype(str).str[:7]  # YYYY-MM
    out["value"] = pd.to_numeric(out["value"], errors="coerce")
    out = out[out["value"].notna()]
    out["base_period"] = out["base_period"].where(out["base_period"].notna(), None)
    out["base_period"] = out["base_period"].replace({"": None, "nan": None})
    out["series_key"] = (
        out["country_code"].astype(str) + ".M.N.CPI."
        + out["unit_measure"].astype(str) + "._T.N."
        + out["transform"].astype(str)
    )
    cols = [
        "country_code", "country_name", "frequency", "methodology", "measure",
        "unit_measure", "expenditure", "adjustment", "transform", "period",
        "value", "base_period", "series_key",
    ]
    return out[cols].reset_index(drop=True)


def log_summary(df: pd.DataFrame, label: str) -> None:
    if df.empty:
        logging.info(f"{label}: 0 rows")
        return
    for code, grp in df.groupby("country_code"):
        logging.info(
            f"{label} {code}: {len(grp):,} rows, "
            f"max(period)={grp['period'].max()}"
        )


def extract(areas: list[str], start: str, dry_run: bool) -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    failures: list[str] = []

    for series in SERIES:
        url = build_url(areas, series["unit_measure"], series["transform"], start)
        try:
            text = fetch_csv(url)
        except Exception as exc:
            logging.error(f"Failed {series['label']}: {exc}")
            failures.append(series["label"])
            continue

        if not text.strip():
            logging.warning(f"Empty response for {series['label']}")
            failures.append(series["label"])
            continue

        raw = pd.read_csv(StringIO(text))
        logging.info(f"Raw {series['label']}: {len(raw):,} rows")
        norm = normalize(raw)
        log_summary(norm, series["label"])
        frames.append(norm)
        # Be polite between series pulls
        time.sleep(1)

    if not frames:
        raise SystemExit(f"No data extracted. Failures: {failures}")

    combined = pd.concat(frames, ignore_index=True)
    # Deduplicate on natural key
    combined = combined.drop_duplicates(
        subset=["country_code", "unit_measure", "transform", "period"],
        keep="last",
    )

    present = set(combined["country_code"].unique())
    skipped = [a for a in areas if a not in present]
    if skipped:
        logging.warning(f"Areas with no observations: {', '.join(skipped)}")
    if failures:
        logging.warning(f"Series fetch failures: {', '.join(failures)}")

    logging.info(
        f"Total observations: {len(combined):,} across "
        f"{combined['country_code'].nunique()} countries"
    )

    if dry_run:
        logging.info("Dry run: not writing CSV")
        for code, grp in combined.groupby("country_code"):
            yoy = grp[(grp["unit_measure"] == "PA") & (grp["transform"] == "GY")]
            ix = grp[(grp["unit_measure"] == "IX") & (grp["transform"] == "_Z")]
            logging.info(
                f"  {code}: YoY={len(yoy)} (max {yoy['period'].max() if len(yoy) else 'n/a'}), "
                f"IX={len(ix)} (max {ix['period'].max() if len(ix) else 'n/a'})"
            )
        return combined

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(OUT_CSV, index=False)
    logging.info(f"Wrote {len(combined):,} rows to {OUT_CSV}")
    return combined


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--areas",
        default=",".join(DEFAULT_AREAS),
        help="Comma-separated REF_AREA codes (default: allowlist)",
    )
    parser.add_argument(
        "--start",
        default="2015-01",
        help="startPeriod for OECD query (default: 2015-01)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="fetch and report counts without writing the CSV",
    )
    args = parser.parse_args()
    areas = [a.strip().upper() for a in args.areas.split(",") if a.strip()]
    if not areas:
        raise SystemExit("No areas specified")
    logging.info(f"Areas ({len(areas)}): {', '.join(areas)}")
    extract(areas, args.start, args.dry_run)


if __name__ == "__main__":
    main()
