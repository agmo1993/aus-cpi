"""Load extracted industry GVA CSVs into Postgres.

Reads the two CSVs written by extract_gva.py and upserts them into
auscpi.gva_series_lookup and auscpi.industry_gva_quarterly.

ABS revises previously published chain-volume estimates, so rows are
upserted rather than skipped on conflict.

Usage:
    python load_gva.py
    python load_gva.py --dry-run
    python load_gva.py --prune
"""

import argparse
import logging
import os

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)

LOOKUP_CSV = "./data/gva_lookup.csv"
TIMESERIES_CSV = "./data/gva_timeseries.csv"
PAGE_SIZE = 5000

UPSERT_LOOKUP = """
    INSERT INTO auscpi.gva_series_lookup
        (seriesid, industry, subdivision, series_type, unit)
    VALUES %s
    ON CONFLICT (seriesid) DO UPDATE SET
        industry = EXCLUDED.industry,
        subdivision = EXCLUDED.subdivision,
        series_type = EXCLUDED.series_type,
        unit = EXCLUDED.unit;
"""

UPSERT_TIMESERIES = """
    INSERT INTO auscpi.industry_gva_quarterly
        (publish_date, seriesid, gva_value, industry, subdivision, series_type)
    VALUES %s
    ON CONFLICT (seriesid, publish_date) DO UPDATE SET
        gva_value = EXCLUDED.gva_value,
        industry = EXCLUDED.industry,
        subdivision = EXCLUDED.subdivision,
        series_type = EXCLUDED.series_type;
"""

CREATE_LOADED = """
    CREATE TEMP TABLE loaded_gva_seriesid (seriesid text PRIMARY KEY) ON COMMIT DROP;
"""

PRUNE_TIMESERIES = """
    DELETE FROM auscpi.industry_gva_quarterly
    WHERE seriesid NOT IN (SELECT seriesid FROM loaded_gva_seriesid);
"""

PRUNE_LOOKUP = """
    DELETE FROM auscpi.gva_series_lookup
    WHERE seriesid NOT IN (SELECT seriesid FROM loaded_gva_seriesid);
"""


def connect():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME", "auscpidb"),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASS"],
        sslmode=os.getenv("DB_SSLMODE", "require"),
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report what would be loaded without connecting",
    )
    parser.add_argument(
        "--prune",
        action="store_true",
        help="delete GVA rows absent from the CSVs",
    )
    args = parser.parse_args()

    lookup = pd.read_csv(LOOKUP_CSV)
    timeseries = pd.read_csv(TIMESERIES_CSV)
    logging.info(f"Read {len(lookup):,} series and {len(timeseries):,} observations")

    lookup = lookup.astype(object).where(lookup.notna(), None)
    timeseries = timeseries.astype(object).where(timeseries.notna(), None)

    lookup_rows = [
        (
            row["Series ID"],
            row["Industry"],
            row["Subdivision"],
            row["Series Type"],
            row["Unit"],
        )
        for _, row in lookup.iterrows()
    ]
    timeseries_rows = [
        (
            row["Date"],
            row["Series ID"],
            row["GVA Value"],
            row["Industry"],
            row["Subdivision"],
            row["Series Type"],
        )
        for _, row in timeseries.iterrows()
    ]

    if args.dry_run:
        logging.info("Dry run: nothing written")
        logging.info(
            f"Industries: {lookup['Industry'].nunique()}  "
            f"types: {', '.join(sorted(lookup['Series Type'].dropna().unique()))}"
        )
        logging.info(f"Dates: {timeseries['Date'].min()} to {timeseries['Date'].max()}")
        return

    conn = connect()
    try:
        with conn, conn.cursor() as cur:
            logging.info("Upserting auscpi.gva_series_lookup")
            execute_values(cur, UPSERT_LOOKUP, lookup_rows, page_size=PAGE_SIZE)
            logging.info(f"Upserted {cur.rowcount:,} lookup rows")

            logging.info("Upserting auscpi.industry_gva_quarterly")
            execute_values(cur, UPSERT_TIMESERIES, timeseries_rows, page_size=PAGE_SIZE)
            logging.info(f"Upserted {cur.rowcount:,} observation rows")

            if args.prune:
                cur.execute(CREATE_LOADED)
                execute_values(
                    cur,
                    "INSERT INTO loaded_gva_seriesid (seriesid) VALUES %s",
                    [(row[0],) for row in lookup_rows],
                    page_size=PAGE_SIZE,
                )
                cur.execute(PRUNE_TIMESERIES)
                logging.info(f"Pruned {cur.rowcount:,} observation rows")
                cur.execute(PRUNE_LOOKUP)
                logging.info(f"Pruned {cur.rowcount:,} lookup rows")
    finally:
        conn.close()

    logging.info("Done")


if __name__ == "__main__":
    main()
