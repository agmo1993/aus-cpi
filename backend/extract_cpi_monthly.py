"""Extract monthly CPI index numbers from the ABS time series workbooks.

Table 10 supplies the eight capital cities and Table 3 supplies the weighted
average of eight capital cities, which the ABS labels 'Australia'. Together
they cover every location the dashboard reports on.

Writes two CSVs consumed by load_cpi_monthly.py:

    data/cpi_monthly_lookup.csv      one row per series
    data/cpi_monthly_timeseries.csv  one row per observation

Usage:
    MONTH=jun YEAR=2026 python extract_cpi_monthly.py
    python extract_cpi_monthly.py --month jun --year 2026
    python extract_cpi_monthly.py --skip-download   # re-parse local workbooks
"""

import argparse
import logging
import os
import re
import urllib.request

import pandas as pd

from abs_sources import INDEX_NUMBER_PREFIX, SOURCES, SOURCES_BY_TABLE

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)

LOOKUP_CSV = './data/cpi_monthly_lookup.csv'
TIMESERIES_CSV = './data/cpi_monthly_timeseries.csv'

# The Index and DataN sheets both carry nine rows of publication banner above
# their header row.
HEADER_ROWS = 9

DATA_SHEET = re.compile(r'Data\d+')

# ABS rejects the default urllib user agent.
USER_AGENT = 'Mozilla/5.0 (compatible; aus-cpi-etl/1.0)'


def download(source, month, year):
    url = source.url(month, year)
    logging.info(f'Downloading table {source.table} from {url}')
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(request) as response:
        payload = response.read()
    with open(source.path, 'wb') as handle:
        handle.write(payload)
    logging.info(f'Wrote {len(payload):,} bytes to {source.path}')


def read_lookup(source):
    """Return one row per index-number series in the workbook's Index sheet."""
    df = pd.read_excel(source.path, sheet_name='Index', skiprows=HEADER_ROWS)
    df = df[df['Series ID'].notna()]

    # 'Index Numbers ;  All groups CPI ;  Sydney ;' -> prefix, item, location
    parts = df['Data Item Description'].str.split(';', expand=True)
    df = df.assign(
        Prefix=parts[0].str.strip(),
        Item=parts[1].str.strip(),
        Location=parts[2].str.strip(),
    )

    index_numbers = df[df['Prefix'] == INDEX_NUMBER_PREFIX]
    skipped = len(df) - len(index_numbers)
    if skipped:
        logging.info(
            f'Table {source.table}: skipped {skipped} non-index-number series '
            f'(percentage change, contribution)'
        )

    return index_numbers[['Series ID', 'Item', 'Location']].reset_index(drop=True)


def read_observations(source):
    """Return every non-null observation across the workbook's DataN sheets."""
    workbook = pd.ExcelFile(source.path)
    sheets = [name for name in workbook.sheet_names if DATA_SHEET.fullmatch(name)]
    logging.info(f'Table {source.table}: reading {len(sheets)} data sheets')

    frames = []
    for sheet in sheets:
        df = pd.read_excel(workbook, sheet_name=sheet, skiprows=HEADER_ROWS)

        # The header row is the workbook's 'Series ID' row, so the first column
        # is labelled 'Series ID' but actually holds the observation dates.
        df = df.rename(columns={df.columns[0]: 'Date'})
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        df = df[df['Date'].notna()]

        long = df.melt(id_vars='Date', var_name='Series ID', value_name='CPI Value')
        long['CPI Value'] = pd.to_numeric(long['CPI Value'], errors='coerce')
        frames.append(long[long['CPI Value'].notna()])

    return pd.concat(frames, ignore_index=True)


def drop_duplicate_labels(lookup):
    """Drop series whose item and location duplicate an earlier series.

    The ABS hierarchy repeats a label when a group has a single child sub-group
    or expenditure class: 'Communication' is published both as a group and as
    an expenditure class, under different series IDs but the same description.
    The two carry the same values apart from occasional 0.01 rounding, and
    auscpi.seriesid_lookup is unique on (item, city, data_frequency), so only
    one can be loaded. Index sheets run group -> sub-group -> expenditure
    class, so the first occurrence is the broadest level.
    """
    duplicated = lookup.duplicated(subset=['Item', 'Location'], keep='first')
    for _, row in lookup[duplicated].iterrows():
        logging.info(
            f"Dropping {row['Series ID']}: duplicate label for "
            f"{row['Item']} / {row['Location']}"
        )
    if duplicated.any():
        logging.info(f'Dropped {duplicated.sum()} duplicate-label series')
    return lookup[~duplicated].reset_index(drop=True)


def main():
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--month', default=os.getenv('MONTH'),
                        help="release month slug, e.g. 'jun' (default: $MONTH)")
    parser.add_argument('--year', default=os.getenv('YEAR'),
                        help='release year, e.g. 2026 (default: $YEAR)')
    parser.add_argument('--skip-download', action='store_true',
                        help='parse the workbooks already in ./data')
    parser.add_argument('--table', type=int, action='append', dest='tables',
                        choices=sorted(SOURCES_BY_TABLE),
                        help='limit to one table (repeatable; default: all)')
    args = parser.parse_args()

    sources = ([SOURCES_BY_TABLE[t] for t in args.tables]
               if args.tables else SOURCES)

    if not args.skip_download and not (args.month and args.year):
        parser.error('--month and --year are required unless --skip-download')

    lookups, observations = [], []
    for source in sources:
        if not args.skip_download:
            download(source, args.month, args.year)
        logging.info(f'Table {source.table}: {source.description}')
        lookups.append(read_lookup(source))
        observations.append(read_observations(source))

    lookup = drop_duplicate_labels(pd.concat(lookups, ignore_index=True))

    # Restricting to the surviving series drops both the duplicate labels and
    # the non-index-number columns that were never in the lookup.
    timeseries = pd.concat(observations, ignore_index=True)
    timeseries = timeseries.merge(lookup, on='Series ID', how='inner')
    timeseries = timeseries.sort_values(['Date', 'Series ID'])
    timeseries['Date'] = timeseries['Date'].dt.strftime('%Y-%m-%d')

    lookup.to_csv(LOOKUP_CSV, index=False)
    timeseries[['Date', 'Series ID', 'CPI Value', 'Item', 'Location']].to_csv(
        TIMESERIES_CSV, index=False)

    logging.info(f'Wrote {len(lookup):,} series to {LOOKUP_CSV}')
    logging.info(f'Wrote {len(timeseries):,} observations to {TIMESERIES_CSV}')
    logging.info(
        f"Locations: {', '.join(sorted(lookup['Location'].unique()))}")
    logging.info(
        f"Dates: {timeseries['Date'].min()} to {timeseries['Date'].max()}")


if __name__ == '__main__':
    main()
