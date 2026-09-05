"""Load OECD CPI observations CSV into auscpi.oecd_cpi.

Reads backend/data/oecd_cpi_observations.csv written by extract_oecd_cpi.py
and upserts into Neon Postgres (same DB as ABS loads).

Usage:
    python load_oecd_cpi.py
    python load_oecd_cpi.py --dry-run
    python load_oecd_cpi.py --ensure-schema   # CREATE TABLE IF NOT EXISTS first
"""

from __future__ import annotations

import argparse
import logging
import os
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)

CSV_PATH = Path(__file__).resolve().parent / "data" / "oecd_cpi_observations.csv"
SCHEMA_SQL = Path(__file__).resolve().parent / "deploy" / "09-add-oecd-cpi.sql"
PAGE_SIZE = 5000

UPSERT = """
    INSERT INTO auscpi.oecd_cpi (
        country_code, country_name, frequency, methodology, measure,
        unit_measure, expenditure, adjustment, transform, period,
        value, base_period, series_key
    )
    VALUES %s
    ON CONFLICT (country_code, unit_measure, transform, period) DO UPDATE SET
        value = EXCLUDED.value,
        country_name = EXCLUDED.country_name,
        base_period = EXCLUDED.base_period,
        series_key = EXCLUDED.series_key,
        fetched_at = now();
"""


def _sslmode() -> str:
    # frontend-next16/.env.local uses DB_SSL=true; psycopg2 wants sslmode.
    mode = os.getenv("DB_SSLMODE") or os.getenv("DB_SSL") or "require"
    if mode.lower() in ("true", "1", "yes"):
        return "require"
    if mode.lower() in ("false", "0", "no"):
        return "disable"
    return mode


def connect():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME", "auscpidb"),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASS"],
        sslmode=_sslmode(),
    )


def ensure_schema(conn) -> None:
    sql = SCHEMA_SQL.read_text()
    body = "\n".join(
        line for line in sql.splitlines()
        if line.strip().upper() not in ("BEGIN;", "COMMIT;")
        and not line.strip().startswith("--")
    )
    with conn.cursor() as cur:
        cur.execute(body)
    conn.commit()
    logging.info("Ensured auscpi.oecd_cpi exists")


def rows_from_csv(df: pd.DataFrame) -> list[tuple]:
    rows = []
    for _, r in df.iterrows():
        period = str(r["period"])[:7] + "-01"
        base = r.get("base_period")
        if pd.isna(base) or base is None or str(base) in ("", "nan", "None"):
            base = None
        else:
            base = str(base)
        rows.append((
            str(r["country_code"]),
            None if pd.isna(r.get("country_name")) else str(r["country_name"]),
            str(r.get("frequency") or "M"),
            str(r.get("methodology") or "N"),
            str(r.get("measure") or "CPI"),
            str(r["unit_measure"]),
            str(r.get("expenditure") or "_T"),
            str(r.get("adjustment") or "N"),
            str(r["transform"]),
            period,
            float(r["value"]),
            base,
            str(r["series_key"]),
        ))
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="parse CSV and report; no DB writes")
    parser.add_argument("--ensure-schema", action="store_true",
                        help="CREATE TABLE IF NOT EXISTS before load")
    parser.add_argument("--csv", default=str(CSV_PATH),
                        help="path to observations CSV")
    args = parser.parse_args()

    df = pd.read_csv(args.csv)
    logging.info(f"Read {len(df):,} rows from {args.csv}")
    logging.info(
        f"Countries: {', '.join(sorted(df['country_code'].unique()))}"
    )
    logging.info(f"Periods: {df['period'].min()} to {df['period'].max()}")

    rows = rows_from_csv(df)
    if args.dry_run:
        logging.info(f"Dry run: would upsert {len(rows):,} rows")
        return

    conn = connect()
    try:
        if args.ensure_schema:
            ensure_schema(conn)
        with conn, conn.cursor() as cur:
            logging.info("Upserting auscpi.oecd_cpi")
            execute_values(cur, UPSERT, rows, page_size=PAGE_SIZE)
            logging.info(f"Upserted {cur.rowcount:,} rows (last page count)")
    finally:
        conn.close()
    logging.info("Done")


if __name__ == "__main__":
    main()
