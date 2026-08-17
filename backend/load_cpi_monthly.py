"""Load the extracted monthly CPI CSVs into Postgres.

Reads the two CSVs written by extract_cpi_monthly.py, upserts them into
auscpi.seriesid_lookup and auscpi.cpi_index_monthly, then refreshes the
materialized views that depend on them.

Rows are upserted rather than skipped on conflict: the ABS revises index
numbers for months it has already published, and those revisions have to
overwrite what is already loaded.

Usage:
    python load_cpi_monthly.py
    python load_cpi_monthly.py --dry-run       # parse and report, touch nothing
    python load_cpi_monthly.py --no-refresh    # skip the view refresh
    python load_cpi_monthly.py --prune         # also delete what the CSVs omit
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

LOOKUP_CSV = './data/cpi_monthly_lookup.csv'
TIMESERIES_CSV = './data/cpi_monthly_timeseries.csv'

DATA_FREQUENCY = 'Monthly'
PAGE_SIZE = 5000

MATERIALIZED_VIEWS = [
    'auscpi.cpi_pct_monthly',
    'auscpi.cpi_pct_yearly_base2017',
]

UPSERT_LOOKUP = '''
    INSERT INTO auscpi.seriesid_lookup (seriesid, item, city, data_frequency)
    VALUES %s
    ON CONFLICT (seriesid) DO UPDATE SET
        item = EXCLUDED.item,
        city = EXCLUDED.city,
        data_frequency = EXCLUDED.data_frequency;
'''

UPSERT_TIMESERIES = '''
    INSERT INTO auscpi.cpi_index_monthly (publish_date, seriesid, cpi_value, item, city)
    VALUES %s
    ON CONFLICT (seriesid, publish_date) DO UPDATE SET
        cpi_value = EXCLUDED.cpi_value,
        item = EXCLUDED.item,
        city = EXCLUDED.city;
'''

CREATE_LOADED = '''
    CREATE TEMP TABLE loaded_seriesid (seriesid text PRIMARY KEY) ON COMMIT DROP;
'''

# Observations go before the lookup rows they reference: cpi_index_monthly
# carries fk_seriesid_monthly against seriesid_lookup.
PRUNE_TIMESERIES = '''
    DELETE FROM auscpi.cpi_index_monthly
    WHERE seriesid NOT IN (SELECT seriesid FROM loaded_seriesid);
'''

PRUNE_LOOKUP = '''
    DELETE FROM auscpi.seriesid_lookup
    WHERE data_frequency = %s
      AND seriesid NOT IN (SELECT seriesid FROM loaded_seriesid);
'''


def connect():
    return psycopg2.connect(
        host=os.environ['DB_HOST'],
        port=int(os.getenv('DB_PORT', 5432)),
        database=os.getenv('DB_NAME', 'auscpidb'),
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASS'],
        sslmode=os.getenv('DB_SSLMODE', 'require'),
    )


def main():
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--dry-run', action='store_true',
                        help='report what would be loaded without connecting')
    parser.add_argument('--no-refresh', action='store_true',
                        help='leave the materialized views stale')
    parser.add_argument('--prune', action='store_true',
                        help='delete monthly rows absent from the CSVs, '
                             'reconciling the tables to this extract; only '
                             'safe when the extract covered every source')
    args = parser.parse_args()

    lookup = pd.read_csv(LOOKUP_CSV)
    timeseries = pd.read_csv(TIMESERIES_CSV)
    logging.info(f'Read {len(lookup):,} series and {len(timeseries):,} observations')

    lookup_rows = [
        (row['Series ID'], row['Item'], row['Location'], DATA_FREQUENCY)
        for _, row in lookup.iterrows()
    ]
    timeseries_rows = [
        (row['Date'], row['Series ID'], row['CPI Value'], row['Item'], row['Location'])
        for _, row in timeseries.iterrows()
    ]

    if args.dry_run:
        logging.info('Dry run: nothing written')
        logging.info(f"Locations: {', '.join(sorted(lookup['Location'].unique()))}")
        logging.info(f"Dates: {timeseries['Date'].min()} to {timeseries['Date'].max()}")
        return

    conn = connect()
    try:
        with conn, conn.cursor() as cur:
            # The lookup goes first: cpi_index_monthly.seriesid references it.
            logging.info('Upserting auscpi.seriesid_lookup')
            execute_values(cur, UPSERT_LOOKUP, lookup_rows, page_size=PAGE_SIZE)
            logging.info(f'Upserted {cur.rowcount:,} lookup rows')

            logging.info('Upserting auscpi.cpi_index_monthly')
            execute_values(cur, UPSERT_TIMESERIES, timeseries_rows, page_size=PAGE_SIZE)
            logging.info(f'Upserted {cur.rowcount:,} observation rows')

            if args.prune:
                cur.execute(CREATE_LOADED)
                execute_values(cur, 'INSERT INTO loaded_seriesid (seriesid) VALUES %s',
                               [(row[0],) for row in lookup_rows], page_size=PAGE_SIZE)

                cur.execute(PRUNE_TIMESERIES)
                logging.info(f'Pruned {cur.rowcount:,} observation rows')

                cur.execute(PRUNE_LOOKUP, (DATA_FREQUENCY,))
                logging.info(f'Pruned {cur.rowcount:,} lookup rows')

        if not args.no_refresh:
            # Each refresh is its own transaction so a slow one cannot hold the
            # write above open.
            for view in MATERIALIZED_VIEWS:
                logging.info(f'Refreshing {view}')
                with conn, conn.cursor() as cur:
                    cur.execute(f'REFRESH MATERIALIZED VIEW {view};')
    finally:
        conn.close()

    logging.info('Done')


if __name__ == '__main__':
    main()
