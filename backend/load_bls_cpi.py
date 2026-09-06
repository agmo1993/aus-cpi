"""Load BLS CPI observations + ABS↔BLS crosswalk into Neon.

Reads:
  - backend/data/bls_cpi_observations.csv (from extract_bls_cpi.py)
  - backend/data/abs_bls_category_crosswalk.csv

Usage:
    python load_bls_cpi.py --ensure-schema
    python load_bls_cpi.py --dry-run
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

DATA_DIR = Path(__file__).resolve().parent / "data"
OBS_CSV = DATA_DIR / "bls_cpi_observations.csv"
CROSSWALK_CSV = DATA_DIR / "abs_bls_category_crosswalk.csv"
SCHEMA_SQL = Path(__file__).resolve().parent / "deploy" / "10-add-bls-cpi.sql"
PAGE_SIZE = 5000

UPSERT_SERIES = """
    INSERT INTO auscpi.bls_series (series_id, item_code, item_name, area_code, seasonal, periodicity)
    VALUES %s
    ON CONFLICT (series_id) DO UPDATE SET
        item_code = EXCLUDED.item_code,
        item_name = EXCLUDED.item_name;
"""

UPSERT_OBS = """
    INSERT INTO auscpi.bls_cpi_index (series_id, publish_date, value)
    VALUES %s
    ON CONFLICT (series_id, publish_date) DO UPDATE SET
        value = EXCLUDED.value;
"""

UPSERT_CROSSWALK = """
    INSERT INTO auscpi.cpi_category_crosswalk
        (abs_item, bls_item_code, bls_item_name, match_quality, notes)
    VALUES %s
    ON CONFLICT (abs_item, bls_item_code) DO UPDATE SET
        bls_item_name = EXCLUDED.bls_item_name,
        match_quality = EXCLUDED.match_quality,
        notes = EXCLUDED.notes;
"""


def _sslmode() -> str:
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
    # Strip BEGIN/COMMIT and comment-only lines for a single execute block
    lines = []
    for line in sql.splitlines():
        s = line.strip()
        if s.upper() in ("BEGIN;", "COMMIT;") or s.startswith("--"):
            continue
        lines.append(line)
    body = "\n".join(lines)
    with conn.cursor() as cur:
        cur.execute(body)
    conn.commit()
    logging.info("Ensured bls_series, bls_cpi_index, cpi_category_crosswalk")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--ensure-schema", action="store_true")
    parser.add_argument("--obs-csv", default=str(OBS_CSV))
    parser.add_argument("--crosswalk-csv", default=str(CROSSWALK_CSV))
    args = parser.parse_args()

    obs = pd.read_csv(args.obs_csv)
    xwalk = pd.read_csv(args.crosswalk_csv)
    logging.info(f"Observations: {len(obs):,} rows, series={sorted(obs['series_id'].unique())}")
    logging.info(f"Crosswalk: {len(xwalk):,} rows")

    series_rows = []
    for sid, g in obs.groupby("series_id"):
        row0 = g.iloc[0]
        series_rows.append((
            str(sid),
            str(row0["item_code"]),
            None if pd.isna(row0.get("item_name")) else str(row0["item_name"]),
            "0000",
            "U",
            "R",
        ))

    obs_rows = []
    for _, r in obs.iterrows():
        period = str(r["period"])[:7] + "-01"
        obs_rows.append((str(r["series_id"]), period, float(r["value"])))

    xwalk_rows = []
    for _, r in xwalk.iterrows():
        notes = r.get("notes")
        if pd.isna(notes):
            notes = None
        else:
            notes = str(notes)
        name = r.get("bls_item_name")
        if pd.isna(name):
            name = None
        else:
            name = str(name)
        xwalk_rows.append((
            str(r["abs_item"]),
            str(r["bls_item_code"]),
            name,
            str(r["match_quality"]),
            notes,
        ))

    if args.dry_run:
        logging.info(
            f"Dry run: would upsert {len(series_rows)} series, "
            f"{len(obs_rows)} obs, {len(xwalk_rows)} crosswalk"
        )
        return

    conn = connect()
    try:
        if args.ensure_schema:
            ensure_schema(conn)
        with conn, conn.cursor() as cur:
            logging.info("Upserting bls_series")
            execute_values(cur, UPSERT_SERIES, series_rows, page_size=PAGE_SIZE)
            logging.info("Upserting bls_cpi_index")
            execute_values(cur, UPSERT_OBS, obs_rows, page_size=PAGE_SIZE)
            logging.info("Upserting cpi_category_crosswalk")
            execute_values(cur, UPSERT_CROSSWALK, xwalk_rows, page_size=PAGE_SIZE)
        logging.info("Done")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
