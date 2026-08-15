"""Extract the CPI weighting pattern from the ABS weights workbook.

The ABS publishes one weighting pattern workbook a year. Every table in it
carries the same 132 rows -- 11 groups, 33 sub-groups, 87 expenditure classes
and the All groups total -- and encodes the hierarchy by indentation rather
than by a level
column: a group's label sits in column A, a sub-group's in column B and an
expenditure class's in column C, and each table's values are indented to match.
For city k and level l the value lives at column 3 + 3*k + l.

Four of the five tables are read; Table 1 is Table 2's last column and adds
nothing.

    Table 2  weight, per capital city and the weighted average of the eight
    Table 3  the city's share of the national weight for that item
    Table 4  points contribution to the All groups CPI
    Table 5  the previous year's weight, weighted average only

Writes one row per item and location:

    data/cpi_weights.csv

Usage:
    python extract_weights.py
    python extract_weights.py --workbook ./data/some-other-pattern.xlsx
"""

import argparse
import logging
import re

import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)

WORKBOOK = './data/Consumer Price Index - 2025 Weighting Pattern.xlsx'
WEIGHTS_CSV = './data/cpi_weights.csv'

# The ABS labels the weighted average of the eight capital cities 'Australia'
# in the time series workbooks, so the extracted weights use that name too and
# join to the series lookup without a crosswalk.
CITIES = ['Sydney', 'Melbourne', 'Brisbane', 'Adelaide', 'Perth', 'Hobart',
          'Darwin', 'Canberra', 'Australia']

LEVELS = ['group', 'sub-group', 'expenditure class']

# The workbook's last row is the All groups total, which the tables carry at
# group indentation. It is the root of the hierarchy rather than a twelfth
# group: its weight is 100, and its row of Table 3 gives each city's share of
# the weighted average, which nothing else in the workbook supplies.
TOTAL = 'All groups CPI'
TOTAL_LEVEL = 'all groups'

# Rows above the first data row. Table 3 stacks an extra reference-period row
# above its city headings, so its data starts one row lower than the rest.
HEADER_ROWS = {'Table 2': 7, 'Table 3': 8, 'Table 4': 7, 'Table 5': 7}

# The label columns are followed by three value columns per reported series,
# one for each level of the hierarchy.
LABEL_COLUMNS = 3

TERMINATOR = 'ALL GROUPS CPI'

# 'Consumer Price Index, Weighting Pattern, 2025' names the pattern, and
# 'Percentage contribution to the All groups CPI in December 2024' names the
# period the weights are price-updated to. That period is the link period, and
# index numbers can only be aggregated with weights over the span the pattern
# was in force, so both are carried through to the output.
PATTERN = re.compile(r'Weighting Pattern,\s*(\d{4})')
LINK_PERIOD = re.compile(r'in ([A-Z][a-z]+ \d{4})')


def read_provenance(workbook):
    """Return the pattern year and link period from Table 1's banner rows."""
    banner = pd.read_excel(workbook, sheet_name='Table 1', header=None, nrows=7)
    text = '\n'.join(str(value) for value in banner.stack())

    pattern = PATTERN.search(text)
    link_period = LINK_PERIOD.search(text)
    if not (pattern and link_period):
        raise ValueError('Table 1 does not name a weighting pattern and link period')

    return int(pattern.group(1)), pd.Timestamp(link_period.group(1)).date()


def read_table(workbook, sheet, series):
    """Return one row per item and reported series from an indented table.

    `series` names the value blocks in column order: the capital cities for
    Tables 2 to 4, and the two weighting patterns for Table 5.
    """
    df = pd.read_excel(workbook, sheet_name=sheet, header=None,
                       skiprows=HEADER_ROWS[sheet])

    records = []
    parents = {}
    for row in df.itertuples(index=False, name=None):
        labels = [row[column] for column in range(LABEL_COLUMNS)]
        indent = [i for i, label in enumerate(labels) if pd.notna(label)]
        if not indent:
            continue

        level = indent[-1]
        item = str(labels[level]).strip()
        total = item == TERMINATOR

        # Groups are upper case in the workbook and sentence case in the time
        # series lookup, so they are folded to the lookup's spelling and join
        # to it without a crosswalk. The same label can appear at two levels
        # when a group has a single child; recording the level keeps the two
        # rows apart.
        if level == 0:
            item = TOTAL if total else item.capitalize()

        parents[level] = item
        parent = TOTAL if level == 0 else parents.get(level - 1)

        for offset, name in enumerate(series):
            value = row[LABEL_COLUMNS + LABEL_COLUMNS * offset + level]
            records.append((item, TOTAL_LEVEL if total else LEVELS[level],
                            None if total else parent, name, value))

        if total:
            break

    frame = pd.DataFrame(
        records, columns=['Item', 'Level', 'Parent', 'Series', 'Value'])
    logging.info(
        f'{sheet}: read {frame["Item"].nunique()} items '
        f'x {len(series)} series')
    return frame


def pivot(frame, column):
    """Reshape a table's long records into one row per item and series."""
    return frame.rename(columns={'Series': 'Location', 'Value': column})


def main():
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--workbook', default=WORKBOOK,
                        help=f'weighting pattern workbook (default: {WORKBOOK})')
    parser.add_argument('--out', default=WEIGHTS_CSV,
                        help=f'destination CSV (default: {WEIGHTS_CSV})')
    args = parser.parse_args()

    workbook = pd.ExcelFile(args.workbook)
    logging.info(f'Reading {args.workbook}')

    pattern, link_period = read_provenance(workbook)
    logging.info(f'Weighting pattern {pattern}, link period {link_period}')

    weights = pivot(read_table(workbook, 'Table 2', CITIES), 'Weight')
    shares = pivot(read_table(workbook, 'Table 3', CITIES), 'City Share')
    points = pivot(read_table(workbook, 'Table 4', CITIES), 'Points')

    # Table 5 reports the weighted average only, under both patterns. Its
    # current-pattern column repeats Table 2's last column, so only the
    # previous pattern is carried through.
    previous = read_table(workbook, 'Table 5', ['Current', 'Previous'])
    previous = previous[previous['Series'] == 'Previous'].assign(
        Location='Australia').rename(columns={'Value': 'Previous Weight'})

    keys = ['Item', 'Level', 'Parent', 'Location']
    df = weights.merge(shares, on=keys).merge(points, on=keys)
    df = df.merge(previous[keys + ['Previous Weight']], on=keys, how='left')
    df = df.assign(Pattern=pattern, **{'Link Period': link_period})

    # Ordering by location keeps the workbook's row order within each, which
    # already runs group -> sub-group -> expenditure class.
    df['Location'] = pd.Categorical(df['Location'], categories=CITIES)
    df = df.sort_values(['Location'], kind='stable')

    columns = ['Pattern', 'Link Period'] + keys + [
        'Weight', 'City Share', 'Points', 'Previous Weight']
    df[columns].to_csv(args.out, index=False)

    logging.info(f'Wrote {len(df):,} rows to {args.out}')
    logging.info(
        f"Levels: {df.groupby('Level', observed=True)['Item'].nunique().to_dict()}")


if __name__ == '__main__':
    main()
