/**
 * Time series alignment
 *
 * Series do not share a start date. The ABS moved to a complete monthly CPI in
 * April 2024, so most series begin there while the subset it had already been
 * pricing monthly runs from September 2017, with two smaller cohorts starting
 * in 2021 and 2022. Anything that compares series therefore has to align them
 * on their dates rather than on array position.
 */

/** A row as returned by the query layer, keyed by column name. */
export type SeriesRow = Record<string, string | number | null | undefined>;

/**
 * Convert an 'mm-yyyy' month key into a sortable ordinal.
 * Sorting the keys as text would place October before February.
 */
export function monthOrdinal(key: string): number {
  const [month, year] = key.split('-').map(Number);
  return year * 12 + (month - 1);
}

function monthKey(row: SeriesRow, xKey: string): string {
  return String(row[xKey] ?? '');
}

function numericValue(row: SeriesRow, yKey: string): number {
  return parseFloat(String(row[yKey] ?? ''));
}

/** Index one series by month key, so it can be looked up per date. */
function indexByMonth(
  series: SeriesRow[],
  xKey: string,
  yKey: string
): Map<string, number> {
  const byMonth = new Map<string, number>();
  for (const row of series) {
    const value = numericValue(row, yKey);
    if (!Number.isNaN(value)) {
      byMonth.set(monthKey(row, xKey), value);
    }
  }
  return byMonth;
}

function sortMonths(months: Iterable<string>): string[] {
  return Array.from(months).sort((a, b) => monthOrdinal(a) - monthOrdinal(b));
}

/**
 * Align series onto every month any of them covers.
 *
 * Months a series does not reach are null, which Recharts leaves as a gap
 * when connectNulls is false, rather than plotting the value at the wrong date.
 */
export function alignOnUnion(
  data: SeriesRow[][],
  xKey: string,
  yKey: string
): { months: string[]; values: (number | null)[][] } {
  const indexed = data.map((series) => indexByMonth(series, xKey, yKey));

  const all = new Set<string>();
  for (const series of indexed) {
    for (const month of series.keys()) all.add(month);
  }
  const months = sortMonths(all);

  return {
    months,
    values: indexed.map((series) =>
      months.map((month) => series.get(month) ?? null)
    ),
  };
}

/**
 * Restrict series to the months every one of them covers.
 *
 * Correlation needs equal-length inputs drawn from the same periods; comparing
 * a 2017-based series against a 2024-based one by position would correlate
 * unrelated months.
 */
export function alignOnIntersection(
  data: SeriesRow[][],
  xKey: string,
  yKey: string
): { months: string[]; values: number[][] } {
  const indexed = data.map((series) => indexByMonth(series, xKey, yKey));

  if (indexed.length === 0) {
    return { months: [], values: [] };
  }

  const shared = Array.from(indexed[0].keys()).filter((month) =>
    indexed.every((series) => series.has(month))
  );
  const months = sortMonths(shared);

  return {
    months,
    values: indexed.map((series) =>
      months.map((month) => series.get(month) as number)
    ),
  };
}

/**
 * Convert an index series to year-over-year percent change.
 * For monthly mm-yyyy keys, lag is 12 months (value_t / value_{t-12} - 1) * 100.
 * Points without a prior observation are dropped.
 */
export function toYearOverYearPercent(
  series: SeriesRow[],
  xKey = 'publish_date',
  yKey = 'cpi_value',
  lagMonths = 12
): SeriesRow[] {
  const byOrd = new Map<number, { key: string; value: number; row: SeriesRow }>();
  for (const row of series) {
    const key = monthKey(row, xKey);
    if (!key) continue;
    const value = numericValue(row, yKey);
    if (Number.isNaN(value)) continue;
    byOrd.set(monthOrdinal(key), { key, value, row });
  }

  const out: SeriesRow[] = [];
  for (const [ord, cur] of [...byOrd.entries()].sort((a, b) => a[0] - b[0])) {
    const prior = byOrd.get(ord - lagMonths);
    if (!prior || prior.value === 0) continue;
    const yoy = ((cur.value / prior.value) - 1) * 100;
    out.push({
      ...cur.row,
      [xKey]: cur.key,
      [yKey]: yoy,
    });
  }
  return out;
}

