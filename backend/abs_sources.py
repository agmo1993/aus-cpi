"""Registry of ABS time series workbooks used for the monthly CPI.

The ABS publishes each table of the Consumer Price Index release as a separate
time series workbook. Every workbook has the same shape: an 'Index' sheet
cataloguing the series, and one or more 'DataN' sheets holding the
observations. Only the table number, the filename and the series coverage
differ, so a single extractor can read all of them.

Filenames are reused across releases and table numbers have been reshuffled
before, so the table number recorded here is the one the workbook carries as at
the June 2026 release. Verify against the release page before adding a source.
"""

from dataclasses import dataclass

# Only series whose Data Item Description starts with this prefix are index
# numbers. Table 3 also carries percentage-change and contribution series that
# share an item and location with their index-number counterpart, and would be
# indistinguishable once the description is split apart.
INDEX_NUMBER_PREFIX = 'Index Numbers'

BASE_URL = (
    'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/'
    'consumer-price-index-australia'
)


@dataclass(frozen=True)
class Source:
    table: int
    filename: str
    description: str

    @property
    def path(self) -> str:
        return f'./data/{self.filename}'

    def url(self, month: str, year: str) -> str:
        return f'{BASE_URL}/{month}-{year}/{self.filename}'


# Ordering matters: where two workbooks describe the same item and location,
# the first one listed wins. They cover disjoint locations today, so this only
# ever applies within a workbook.
SOURCES = [
    Source(
        table=10,
        filename='6401010.xlsx',
        description='Group, Sub-group and Expenditure Class by Capital City',
    ),
    Source(
        table=3,
        filename='640103.xlsx',
        description='Group, Sub-group and Expenditure Class, '
                    'Weighted Average of Eight Capital Cities',
    ),
]

SOURCES_BY_TABLE = {source.table: source for source in SOURCES}
