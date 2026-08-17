"""Load the extracted CPI weighting pattern into Postgres.

Reads the CSV written by extract_weights.py and upserts it into
auscpi.cpi_weights_by_city, keyed on the pattern, item and city. Loading a new
year's pattern adds rows rather than replacing them: index numbers can only be
aggregated with the weights of their own link period, so a series spanning a
re-weighting needs the older patterns too.

The ABS revises a pattern in place when it corrects one, so rows are upserted
rather than skipped on conflict.

Usage:
    python load_weights.py
    python load_weights.py --dry-run     # parse and report, touch nothing
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

WEIGHTS_CSV = './data/cpi_weights.csv'

PAGE_SIZE = 5000

UPSERT_WEIGHTS = '''
    INSERT INTO auscpi.cpi_weights_by_city
        (pattern, link_period, item, city, item_level, parent_item,
         weight, city_share, points, previous_weight)
    VALUES %s
    ON CONFLICT (pattern, item, item_level, city) DO UPDATE SET
        link_period = EXCLUDED.link_period,
        parent_item = EXCLUDED.parent_item,
        weight = EXCLUDED.weight,
        city_share = EXCLUDED.city_share,
        points = EXCLUDED.points,
        previous_weight = EXCLUDED.previous_weight;
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
    parser.add_argument('--weights', default=WEIGHTS_CSV,
                        help=f'extracted weights CSV (default: {WEIGHTS_CSV})')
    parser.add_argument('--dry-run', action='store_true',
                        help='report what would be loaded without connecting')
    args = parser.parse_args()

    weights = pd.read_csv(args.weights)
    logging.info(f'Read {len(weights):,} rows from {args.weights}')

    # Every item has a parent bar the All groups total, and only the weighted
    # average carries a previous weight; both arrive as NaN and have to reach
    # Postgres as NULL.
    weights = weights.astype(object).where(weights.notna(), None)

    rows = [
        (row['Pattern'], row['Link Period'], row['Item'], row['Location'],
         row['Level'], row['Parent'], row['Weight'], row['City Share'],
         row['Points'], row['Previous Weight'])
        for _, row in weights.iterrows()
    ]

    patterns = sorted({row[0] for row in rows})
    logging.info(f"Patterns: {', '.join(str(p) for p in patterns)}")

    if args.dry_run:
        logging.info('Dry run: nothing written')
        logging.info(f"Locations: {', '.join(sorted({row[3] for row in rows}))}")
        return

    conn = connect()
    try:
        with conn, conn.cursor() as cur:
            logging.info('Upserting auscpi.cpi_weights_by_city')
            execute_values(cur, UPSERT_WEIGHTS, rows, page_size=PAGE_SIZE)
            logging.info(f'Upserted {cur.rowcount:,} rows')
    finally:
        conn.close()

    logging.info('Done')


if __name__ == '__main__':
    main()
