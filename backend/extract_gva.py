"""Extract industry GVA from ABS 5206.0 Table 6.

Australian National Accounts: National Income, Expenditure and Product,
Table 6 Gross Value Added by Industry, chain volume measures ($ millions).

Writes two CSVs consumed by load_gva.py:

    data/gva_lookup.csv      one row per series
    data/gva_timeseries.csv  one row per observation

Usage:
    QUARTER=mar YEAR=2026 python extract_gva.py
    python extract_gva.py --quarter mar --year 2026
    python extract_gva.py --skip-download
    python extract_gva.py --series-type all
"""

import argparse
import logging
import os
import re
import urllib.request

import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)

BASE_URL = (
    "https://www.abs.gov.au/statistics/economy/national-accounts/"
    "australian-national-accounts-national-income-expenditure-and-product"
)
FILENAME = "5206006_Industry_GVA.xlsx"
WORKBOOK = f"./data/{FILENAME}"
LOOKUP_CSV = "./data/gva_lookup.csv"
TIMESERIES_CSV = "./data/gva_timeseries.csv"

HEADER_ROWS = 9
DATA_SHEET = re.compile(r"Data\d+")
USER_AGENT = "Mozilla/5.0 (compatible; aus-cpi-etl/1.0)"

SERIES_TYPES = {
    "seasonally-adjusted": "Seasonally Adjusted",
    "trend": "Trend",
    "original": "Original",
    "all": None,
}

QUARTERS = ("mar", "jun", "sep", "dec")


def download(quarter: str, year: str, dest: str) -> None:
    url = f"{BASE_URL}/{quarter}-{year}/{FILENAME}"
    logging.info(f"Downloading {url}")
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request) as response:
        payload = response.read()
    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    with open(dest, "wb") as handle:
        handle.write(payload)
    logging.info(f"Wrote {len(payload):,} bytes to {dest}")


def split_description(description: str) -> tuple[str, str | None]:
    """'Mining (B) ;  Coal Mining ;' -> industry, subdivision."""
    parts = [part.strip() for part in str(description).split(";") if part.strip()]
    if not parts:
        return str(description).strip(), None
    industry = parts[0]
    subdivision = parts[1] if len(parts) > 1 else None
    return industry, subdivision


def read_lookup(workbook: str, series_type: str | None) -> pd.DataFrame:
    df = pd.read_excel(workbook, sheet_name="Index", skiprows=HEADER_ROWS)
    df = df[df["Series ID"].notna()].copy()

    parsed = df["Data Item Description"].map(split_description)
    df["Industry"] = parsed.map(lambda pair: pair[0])
    df["Subdivision"] = parsed.map(lambda pair: pair[1])
    df["Series Type"] = df["Series Type"].str.strip()
    df["Unit"] = df["Unit"].fillna("$ Millions")

    if series_type:
        before = len(df)
        df = df[df["Series Type"] == series_type]
        skipped = before - len(df)
        if skipped:
            logging.info(
                f"Kept {series_type} only: dropped {skipped} "
                f"Trend/Original/other series"
            )

    return df[["Series ID", "Industry", "Subdivision", "Series Type", "Unit"]].reset_index(
        drop=True
    )


def read_observations(workbook: str) -> pd.DataFrame:
    xl = pd.ExcelFile(workbook)
    sheets = [name for name in xl.sheet_names if DATA_SHEET.fullmatch(name)]
    logging.info(f"Reading {len(sheets)} data sheets")

    frames = []
    for sheet in sheets:
        df = pd.read_excel(xl, sheet_name=sheet, skiprows=HEADER_ROWS)
        df = df.rename(columns={df.columns[0]: "Date"})
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        df = df[df["Date"].notna()]

        long = df.melt(id_vars="Date", var_name="Series ID", value_name="GVA Value")
        long["GVA Value"] = pd.to_numeric(long["GVA Value"], errors="coerce")
        frames.append(long[long["GVA Value"].notna()])

    return pd.concat(frames, ignore_index=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--quarter",
        default=os.getenv("QUARTER"),
        choices=QUARTERS,
        help="release quarter slug (default: $QUARTER)",
    )
    parser.add_argument(
        "--year",
        default=os.getenv("YEAR"),
        help="release year, e.g. 2026 (default: $YEAR)",
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="parse the workbook already in ./data",
    )
    parser.add_argument(
        "--series-type",
        default="seasonally-adjusted",
        choices=sorted(SERIES_TYPES),
        help="which ABS series type to keep (default: seasonally-adjusted)",
    )
    parser.add_argument("--workbook", default=WORKBOOK, help="path to the xlsx")
    args = parser.parse_args()

    if not args.skip_download and not (args.quarter and args.year):
        parser.error("--quarter and --year are required unless --skip-download")

    if not args.skip_download:
        download(args.quarter, args.year, args.workbook)

    lookup = read_lookup(args.workbook, SERIES_TYPES[args.series_type])
    timeseries = read_observations(args.workbook)
    timeseries = timeseries.merge(lookup, on="Series ID", how="inner")
    timeseries = timeseries.sort_values(["Date", "Series ID"])
    timeseries["Date"] = timeseries["Date"].dt.strftime("%Y-%m-%d")

    os.makedirs("./data", exist_ok=True)
    lookup.to_csv(LOOKUP_CSV, index=False)
    timeseries[
        [
            "Date",
            "Series ID",
            "GVA Value",
            "Industry",
            "Subdivision",
            "Series Type",
        ]
    ].to_csv(TIMESERIES_CSV, index=False)

    logging.info(f"Wrote {len(lookup):,} series to {LOOKUP_CSV}")
    logging.info(f"Wrote {len(timeseries):,} observations to {TIMESERIES_CSV}")
    logging.info(
        f"Series types: {', '.join(sorted(lookup['Series Type'].dropna().unique()))}"
    )
    logging.info(f"Dates: {timeseries['Date'].min()} to {timeseries['Date'].max()}")


if __name__ == "__main__":
    main()
