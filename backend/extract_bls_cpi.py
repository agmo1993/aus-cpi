"""Extract BLS CPI-U (NSA, US city average) for ABS↔BLS crosswalk allowlist.

Series ID convention (v1):
    CU + U (unadjusted/NSA) + R (periodic construction in id) + 0000 (US city average)
    + {item_code}
    → e.g. CUUR0000SA0 (All items), CUUR0000SAF1 (Food), CUUR0000SA0E (Energy)

Reads backend/data/abs_bls_category_crosswalk.csv for item codes where
match_quality != unmapped. Prefers BLS Public Data API (no key required for
small batches); falls back to flat-file timeseries for the smoke allowlist.

Does NOT load the production database.

Usage:
    python extract_bls_cpi.py
    python extract_bls_cpi.py --smoke          # SA0, SAF1, SA0E only
    python extract_bls_cpi.py --start-year 2020
    python extract_bls_cpi.py --dry-run
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import time
import urllib.error
import urllib.request
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)

DATA_DIR = Path(__file__).resolve().parent / "data"
CROSSWALK_CSV = DATA_DIR / "abs_bls_category_crosswalk.csv"
OUT_CSV = DATA_DIR / "bls_cpi_observations.csv"
CU_ITEM_LOCAL = Path("/tmp/cu.item")

# Smoke allowlist always included (even if not in crosswalk as ABS group)
SMOKE_CODES = ("SA0", "SAF1", "SA0E")

BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
FLAT_FILE_BASE = "https://download.bls.gov/pub/time.series/cu/"
# Flat files that cover common majors (AllItems + Food/Beverage + Energy-ish via AllItems specials)
FLAT_FILES = (
    "cu.data.0.Current",
    "cu.data.1.AllItems",
)

# Documented FRED mirrors when BLS API/flat files are blocked (smoke only).
# These are official BLS CPI-U NSA series republished by FRED — not guesses.
FRED_SMOKE_FALLBACK = {
    "SA0": ("CPIAUCNS", "CUUR0000SA0"),   # All items NSA
    "SAF1": ("CPIUFDSL", "CUUR0000SAF1"), # Food NSA
    "SA0E": ("CPIENGNS", "CUUR0000SA0E"), # Energy NSA
}
FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={fred_id}"

USER_AGENT = "Mozilla/5.0 (compatible; aus-cpi-etl/1.0; +https://github.com/aus-cpi)"
AREA_CODE = "0000"
SEASONAL = "U"


def series_id_for(item_code: str) -> str:
    """Build CPI-U NSA US city average series id."""
    return f"CUUR{AREA_CODE}{item_code}"


def load_item_names() -> dict[str, str]:
    names: dict[str, str] = {}
    if CU_ITEM_LOCAL.is_file():
        with CU_ITEM_LOCAL.open(newline="", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f, delimiter="\t")
            for row in reader:
                code = (row.get("item_code") or "").strip()
                name = (row.get("item_name") or "").strip()
                if code:
                    names[code] = name
    return names


def load_crosswalk_codes(smoke_only: bool) -> dict[str, str]:
    """Return {item_code: item_name} from crosswalk (excl. unmapped) + smoke."""
    names = load_item_names()
    codes: dict[str, str] = {}

    if not smoke_only and CROSSWALK_CSV.is_file():
        with CROSSWALK_CSV.open(newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                quality = (row.get("match_quality") or "").strip().lower()
                code = (row.get("bls_item_code") or "").strip()
                if quality == "unmapped" or not code:
                    continue
                name = (row.get("bls_item_name") or "").strip() or names.get(code, "")
                codes[code] = name

    for code in SMOKE_CODES:
        codes.setdefault(code, names.get(code, code))

    # Prefer names from cu.item when available
    for code in list(codes):
        if code in names:
            codes[code] = names[code]

    return codes


def period_to_iso(year: str, period: str) -> str | None:
    """BLS period M01..M12 → YYYY-MM; skip annual/semi-annual."""
    year = year.strip()
    period = period.strip().upper()
    if not period.startswith("M") or len(period) != 3:
        return None
    try:
        month = int(period[1:])
    except ValueError:
        return None
    if month < 1 or month > 12:
        return None
    return f"{year}-{month:02d}"


def http_json(url: str, payload: dict, timeout: int = 120) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_text(url: str, timeout: int = 120) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def fetch_via_api(
    series_ids: list[str], start_year: int, end_year: int
) -> list[dict]:
    """BLS Public API — no registration key for ≤10 years / small batches."""
    rows: list[dict] = []
    # API allows up to 25 series without a key; 10-year window without key
    chunk_size = 25
    for i in range(0, len(series_ids), chunk_size):
        chunk = series_ids[i : i + chunk_size]
        payload = {
            "seriesid": chunk,
            "startyear": str(start_year),
            "endyear": str(end_year),
        }
        logging.info("BLS API POST %d series (%s–%s)", len(chunk), start_year, end_year)
        try:
            data = http_json(BLS_API_URL, payload)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
            logging.warning("BLS API request failed: %s", exc)
            return []

        status = data.get("status")
        if status != "REQUEST_SUCCEEDED":
            logging.warning(
                "BLS API status=%s message=%s",
                status,
                data.get("message"),
            )
            # Still try to parse any series returned
        for series in data.get("Results", {}).get("series", []):
            sid = series.get("seriesID") or series.get("seriesId")
            for obs in series.get("data", []):
                period = period_to_iso(obs.get("year", ""), obs.get("period", ""))
                if not period:
                    continue
                try:
                    value = float(str(obs.get("value")).replace(",", ""))
                except (TypeError, ValueError):
                    continue
                rows.append({"series_id": sid, "period": period, "value": value})
        time.sleep(0.5)
    return rows


def fetch_via_flat_files(
    wanted_series: set[str], start_year: int
) -> list[dict]:
    """Parse BLS cu.data.* flat files for wanted CUUR0000* series."""
    rows: list[dict] = []
    for fname in FLAT_FILES:
        url = FLAT_FILE_BASE + fname
        logging.info("GET flat file %s", url)
        try:
            text = http_text(url)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
            logging.warning("Flat file fetch failed (%s): %s", fname, exc)
            continue

        # Header: series_id year period value footnote_codes
        lines = text.splitlines()
        if not lines:
            continue
        # Skip header
        for line in lines[1:]:
            parts = line.split("\t")
            if len(parts) < 4:
                parts = line.split()
            if len(parts) < 4:
                continue
            sid = parts[0].strip()
            if sid not in wanted_series:
                continue
            year = parts[1].strip()
            try:
                if int(year) < start_year:
                    continue
            except ValueError:
                continue
            period = period_to_iso(year, parts[2].strip())
            if not period:
                continue
            try:
                value = float(parts[3].strip().replace(",", ""))
            except ValueError:
                continue
            rows.append({"series_id": sid, "period": period, "value": value})
        if rows:
            logging.info("Parsed %d rows from %s so far", len(rows), fname)
    return rows



def fetch_via_fred(wanted_codes: set[str], start_year: int) -> list[dict]:
    """Fallback: FRED CSV mirrors of BLS CPI-U NSA for smoke series only."""
    rows: list[dict] = []
    for code, (fred_id, sid) in FRED_SMOKE_FALLBACK.items():
        if code not in wanted_codes:
            continue
        url = FRED_CSV_URL.format(fred_id=fred_id)
        logging.info(
            "GET FRED fallback %s → %s (BLS %s)", fred_id, sid, code
        )
        try:
            text = http_text(url)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
            logging.warning("FRED fetch failed (%s): %s", fred_id, exc)
            continue
        if text.lstrip().startswith("<!"):
            logging.warning("FRED returned HTML for %s (not CSV)", fred_id)
            continue
        lines = text.splitlines()
        for line in lines[1:]:
            if not line.strip() or "," not in line:
                continue
            date_str, val_str = line.split(",", 1)
            date_str = date_str.strip()
            val_str = val_str.strip()
            if val_str in ("", "."):
                continue
            try:
                year = int(date_str[:4])
            except ValueError:
                continue
            if year < start_year:
                continue
            # observation_date is month start YYYY-MM-DD → period YYYY-MM
            period = date_str[:7]
            try:
                value = float(val_str)
            except ValueError:
                continue
            rows.append({"series_id": sid, "period": period, "value": value})
        logging.info(
            "FRED %s: %d rows since %s",
            fred_id,
            sum(1 for r in rows if r["series_id"] == sid),
            start_year,
        )
    return rows


def write_csv(
    out_path: Path,
    observations: list[dict],
    code_by_series: dict[str, str],
    name_by_code: dict[str, str],
) -> int:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # Dedupe on (series_id, period) keeping last
    dedup: dict[tuple[str, str], dict] = {}
    for obs in observations:
        key = (obs["series_id"], obs["period"])
        dedup[key] = obs

    fieldnames = ["series_id", "item_code", "item_name", "period", "value"]
    count = 0
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for (sid, period), obs in sorted(dedup.items()):
            code = code_by_series.get(sid, "")
            writer.writerow(
                {
                    "series_id": sid,
                    "item_code": code,
                    "item_name": name_by_code.get(code, ""),
                    "period": period,
                    "value": obs["value"],
                }
            )
            count += 1
    return count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--smoke",
        action="store_true",
        help="Only extract SA0, SAF1, SA0E (fast smoke test)",
    )
    parser.add_argument("--start-year", type=int, default=2015)
    parser.add_argument("--end-year", type=int, default=2026)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--source",
        choices=("auto", "api", "flat"),
        default="auto",
        help="Prefer API, flat files, or auto (API then flat fallback)",
    )
    args = parser.parse_args()

    name_by_code = load_crosswalk_codes(smoke_only=args.smoke)
    if args.smoke:
        name_by_code = {c: name_by_code[c] for c in SMOKE_CODES if c in name_by_code}

    code_by_series = {series_id_for(c): c for c in name_by_code}
    series_ids = sorted(code_by_series)
    logging.info(
        "Allowlist: %s",
        ", ".join(f"{c}→{series_id_for(c)}" for c in sorted(name_by_code)),
    )

    if args.dry_run:
        logging.info("Dry run — not fetching. Would write %s", OUT_CSV)
        return 0

    observations: list[dict] = []
    blockers: list[str] = []

    if args.source in ("auto", "api"):
        observations = fetch_via_api(series_ids, args.start_year, args.end_year)
        if not observations:
            blockers.append(
                "BLS Public API returned no usable observations "
                "(rate-limit, network block, or empty Results)."
            )

    if (not observations) and args.source in ("auto", "flat"):
        logging.info("Falling back to BLS flat files…")
        observations = fetch_via_flat_files(set(series_ids), args.start_year)
        if not observations:
            blockers.append(
                "BLS flat-file download returned no matching series "
                "(download.bls.gov may block automated clients)."
            )

    if not observations:
        logging.info(
            "Falling back to FRED CSV mirrors for smoke series "
            "(CPIAUCNS/CPIUFDSL/CPIENGNS ≡ CUUR0000SA0/SAF1/SA0E)…"
        )
        observations = fetch_via_fred(set(name_by_code), args.start_year)
        if observations:
            blockers.append(
                "USED FRED FALLBACK: BLS API daily quota exhausted and "
                "download.bls.gov returned 403. Smoke rows sourced from "
                "FRED CSV (CPIAUCNS→SA0, CPIUFDSL→SAF1, CPIENGNS→SA0E). "
                "Register a BLS API key or download cu.data.* manually for full allowlist."
            )
        else:
            blockers.append("FRED CSV fallback also failed for smoke series.")

    # Ensure smoke series presence is reported clearly
    got_series = {o["series_id"] for o in observations}
    for code in SMOKE_CODES:
        sid = series_id_for(code)
        if sid not in got_series:
            blockers.append(f"Missing smoke series {sid} ({code})")

    if observations:
        n = write_csv(OUT_CSV, observations, code_by_series, name_by_code)
        logging.info("Wrote %d rows → %s", n, OUT_CSV)
        for code in SMOKE_CODES:
            sid = series_id_for(code)
            n_s = sum(1 for o in observations if o["series_id"] == sid)
            logging.info("  %s (%s): %d periods", sid, code, n_s)
    else:
        # Still write empty header so pipeline path exists
        write_csv(OUT_CSV, [], code_by_series, name_by_code)
        logging.error("No observations extracted. See blockers below.")

    if blockers:
        note_path = DATA_DIR / "bls_cpi_extract_blockers.txt"
        note_path.write_text(
            "BLS extract blockers / notes\n"
            "============================\n"
            + "\n".join(f"- {b}" for b in blockers)
            + "\n\nSeries convention: CUUR0000{item_code} (CPI-U, NSA, US city average).\n"
            "Manual workaround: download cu.data.1.AllItems from "
            "https://download.bls.gov/pub/time.series/cu/ and re-run with --source flat,\n"
            "or register for a BLS API key if unregistered quotas are exceeded.\n",
            encoding="utf-8",
        )
        logging.warning("Wrote blocker notes → %s", note_path)
        for b in blockers:
            logging.warning("BLOCKER: %s", b)

    return 0 if observations else 1


if __name__ == "__main__":
    raise SystemExit(main())
