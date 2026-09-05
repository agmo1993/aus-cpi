/**
 * Chat tool handlers — server-only.
 * Wrap existing queries; do not invent SQL. Uses pg via @/lib/queries.
 */

import calculateCorrelation from 'calculate-correlation';
import {
  getMonthlyTimeSeries,
  getQuarterlyTimeSeries,
  getMainCPISeries,
  getLatestReleaseMonth,
  getMultipleTimeSeries,
  getSeriesById,
  getSeriesByItem,
  searchSeries,
  getTopMonthlyIncreases,
  getTopYearlyIncreases,
  getAnnualChangeByItem,
  getPercentageChanges,
  getSeriesStatistics,
  NATIONAL_CITY,
} from '@/lib/queries';
import { alignOnIntersection, monthOrdinal, type SeriesRow } from '@/lib/timeseries';
import type {
  AnswerPart,
  CompareItemAcrossCitiesArgs,
  CorrelateSeriesArgs,
  GetAnnualChangeArgs,
  GetCpiTimeseriesArgs,
  GetSeriesStatsArgs,
  GetTopMoversArgs,
  ResolveSeriesArgs,
  SearchCpiSeriesArgs,
  SeriesListItem,
  ToolResult,
} from './schema';
import type { ChatToolName } from './tools';

/** Same floor as /api/correlate — a year of shared months before Pearson's r. */
const MIN_OVERLAP = 12;

/** Capitals + national average used for cross-city compares. */
const COMPARE_CITIES = [
  'Australia',
  'Sydney',
  'Melbourne',
  'Brisbane',
  'Adelaide',
  'Perth',
  'Hobart',
  'Darwin',
  'Canberra',
] as const;

function timeseriesLabel(item: string | undefined, city: string | undefined, seriesid: string): string {
  if (item && city) return `${item} — ${city}`;
  if (item) return item;
  if (city) return city;
  return seriesid;
}

function seriesLabel(city: string, item: string): string {
  return `${city} - ${item}`;
}

function toListItem(row: {
  seriesid: string;
  item: string;
  city: string;
  data_frequency?: string;
}): SeriesListItem {
  return {
    seriesid: row.seriesid,
    item: row.item,
    city: row.city,
    data_frequency: row.data_frequency,
    label: seriesLabel(row.city, row.item),
  };
}

function sliceByMonth<T extends { publish_date?: string; date?: string }>(
  rows: T[],
  from?: string,
  to?: string,
  key: 'publish_date' | 'date' = 'publish_date'
): T[] {
  if (!from && !to) return rows;
  const fromOrd = from ? monthOrdinal(from) : -Infinity;
  const toOrd = to ? monthOrdinal(to) : Infinity;
  return rows.filter((row) => {
    const k = String((row as Record<string, unknown>)[key] ?? '');
    if (!/^\d{2}-\d{4}$/.test(k)) return false;
    const ord = monthOrdinal(k);
    return ord >= fromOrd && ord <= toOrd;
  });
}

function trimSparkline<T>(points: T[] | undefined, n: number): T[] | undefined {
  if (!points) return undefined;
  if (points.length <= n) return points;
  return points.slice(points.length - n);
}

/** Home-page MoM / QoQ / YoY arithmetic on the headline monthly series. */
function deriveHeadlineChanges(
  mainSeries: Array<{ date: string; cpi: string }>
): {
  monthlyChange: string;
  quarterlyChange: string;
  annualChange: string;
  annualDelta: number;
  quarterlyDelta: number;
  latestVal: number;
  latestMonth: string | undefined;
} {
  const latestCPI = mainSeries[mainSeries.length - 1] || { cpi: '0', date: '' };
  const previousCPI = mainSeries[mainSeries.length - 2] || { cpi: '0' };
  const quarterAgo = mainSeries[mainSeries.length - 4] || { cpi: '0' };
  const priorQuarterAgo = mainSeries[mainSeries.length - 7] || { cpi: '0' };
  const yearAgo = mainSeries[mainSeries.length - 13] || { cpi: '0' };

  const latestVal = parseFloat(latestCPI.cpi);
  const prevVal = parseFloat(previousCPI.cpi);
  const quarterVal = parseFloat(quarterAgo.cpi);
  const priorQuarterVal = parseFloat(priorQuarterAgo.cpi);
  const yearVal = parseFloat(yearAgo.cpi);

  const monthlyChange = prevVal
    ? (((latestVal - prevVal) / prevVal) * 100).toFixed(1)
    : '0.0';
  const quarterlyChange = quarterVal
    ? (((latestVal - quarterVal) / quarterVal) * 100).toFixed(1)
    : '0.0';
  const priorQuarterlyChange =
    priorQuarterVal && quarterVal
      ? ((quarterVal - priorQuarterVal) / priorQuarterVal) * 100
      : 0;
  const quarterlyDelta = parseFloat(quarterlyChange) - priorQuarterlyChange;
  const annualChange = yearVal
    ? (((latestVal - yearVal) / yearVal) * 100).toFixed(1)
    : '0.0';

  const priorLatest = parseFloat(mainSeries[mainSeries.length - 2]?.cpi ?? '0');
  const priorYearAgo = parseFloat(mainSeries[mainSeries.length - 14]?.cpi ?? '0');
  const priorAnnualChange = priorYearAgo
    ? ((priorLatest - priorYearAgo) / priorYearAgo) * 100
    : 0;
  const annualDelta = parseFloat(annualChange) - priorAnnualChange;

  return {
    monthlyChange,
    quarterlyChange,
    annualChange,
    annualDelta,
    quarterlyDelta,
    latestVal,
    latestMonth: latestCPI.date || undefined,
  };
}

function deltaDirection(delta: number): 'up' | 'down' | 'neutral' {
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'neutral';
}

async function handleSearchCpiSeries(args: SearchCpiSeriesArgs): Promise<ToolResult> {
  const rows = await searchSeries(args.query, args.frequency);
  const limited = rows.slice(0, args.limit);
  const items = limited.map(toListItem);
  return {
    data: { items, totalMatched: rows.length },
    ui: [{ type: 'series_list', items }],
  };
}

async function handleResolveSeries(args: ResolveSeriesArgs): Promise<ToolResult> {
  if (args.seriesid) {
    const row = await getSeriesById(args.seriesid);
    if (!row) {
      return {
        data: { found: false },
        ui: [{ type: 'text', markdown: `No series found for seriesid \`${args.seriesid}\`.` }],
        error: 'Series not found',
      };
    }
    const items = [toListItem(row)];
    return { data: { found: true, items }, ui: [{ type: 'series_list', items }] };
  }

  const city = args.city ?? NATIONAL_CITY;
  const rows = await getSeriesByItem(args.item!, args.frequency);
  const matched = rows.filter((r) => r.city === city);
  // Fall back to all cities for the item if the preferred city is absent.
  const chosen = matched.length > 0 ? matched : rows;
  if (chosen.length === 0) {
    return {
      data: { found: false },
      ui: [
        {
          type: 'text',
          markdown: `No series found for item \`${args.item}\` in ${city}.`,
        },
      ],
      error: 'Series not found',
    };
  }
  const items = chosen.map(toListItem);
  return { data: { found: true, items }, ui: [{ type: 'series_list', items }] };
}

async function handleGetCpiTimeseries(args: GetCpiTimeseriesArgs): Promise<ToolResult> {
  const raw =
    args.frequency === 'quarterly'
      ? await getQuarterlyTimeSeries(args.seriesid)
      : await getMonthlyTimeSeries(args.seriesid);

  const sliced = sliceByMonth(raw, args.from, args.to, 'publish_date');
  const item = sliced[0]?.item;
  const city = sliced[0]?.city;
  const label = timeseriesLabel(item, city, args.seriesid);
  const points = sliced.map((p) => ({
    date: p.publish_date,
    value: parseFloat(p.cpi_value),
  }));

  const ui: AnswerPart[] = [
    {
      type: 'timeseries',
      series: [{ label, seriesid: args.seriesid, points }],
    },
  ];

  return {
    data: {
      seriesid: args.seriesid,
      frequency: args.frequency,
      item: item ?? label,
      city,
      points: sliced,
    },
    ui,
    asOfMonth: points.length ? points[points.length - 1].date : undefined,
  };
}

async function handleCompareItemAcrossCities(
  args: CompareItemAcrossCitiesArgs
): Promise<ToolResult> {
  const absFreq = args.frequency === 'quarterly' ? 'Quarterly' : 'Monthly';
  const rows = await getSeriesByItem(args.item, absFreq);

  const wanted = new Set(
    (args.cities?.length ? args.cities : [...COMPARE_CITIES]).map((c) =>
      c.trim()
    )
  );

  // Prefer COMPARE_CITIES order; dedupe by city.
  const byCity = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!wanted.has(row.city)) continue;
    if (!byCity.has(row.city)) byCity.set(row.city, row);
  }

  const orderedCities = [
    ...COMPARE_CITIES.filter((c) => byCity.has(c)),
    ...[...byCity.keys()].filter(
      (c) => !(COMPARE_CITIES as readonly string[]).includes(c)
    ),
  ];
  const selected = orderedCities
    .map((c) => byCity.get(c)!)
    .filter(Boolean);

  if (selected.length === 0) {
    return {
      data: { found: false, item: args.item, frequency: args.frequency },
      ui: [
        {
          type: 'text',
          markdown:
            'No capital-city series found for item `' +
            args.item +
            '` (' +
            absFreq +
            '). Try search_cpi_series for the exact ABS name.',
        },
      ],
      error: 'No matching city series',
    };
  }

  const fetched = await Promise.all(
    selected.map(async (row) => {
      const raw =
        args.frequency === 'quarterly'
          ? await getQuarterlyTimeSeries(row.seriesid)
          : await getMonthlyTimeSeries(row.seriesid);
      const points = raw.map((p) => ({
        date: p.publish_date,
        value: parseFloat(p.cpi_value),
      }));
      const label = timeseriesLabel(row.item || args.item, row.city, row.seriesid);
      return {
        row,
        label,
        points,
        series: { label, seriesid: row.seriesid, points },
      };
    })
  );

  const series = fetched.map((f) => f.series);
  const cards = fetched
    .map((f) => {
      const last = f.points[f.points.length - 1];
      if (!last) return null;
      return {
        title: f.row.city,
        value: last.value.toFixed(1),
        trend: {
          value: last.date,
          label: 'latest index',
          direction: 'neutral' as const,
        },
      };
    })
    .filter((c): c is NonNullable<typeof c> => c != null);

  const asOfMonth = cards[0]?.trend?.value;

  return {
    data: {
      item: args.item,
      frequency: args.frequency,
      cities: selected.map((r) => r.city),
      seriesids: selected.map((r) => r.seriesid),
      latest: fetched.map((f) => ({
        city: f.row.city,
        seriesid: f.row.seriesid,
        last: f.points[f.points.length - 1] ?? null,
      })),
    },
    ui: [
      { type: 'timeseries', series },
      ...(cards.length ? [{ type: 'stat_cards' as const, cards }] : []),
    ],
    asOfMonth,
  };
}

async function handleGetHeadlineCpi(): Promise<ToolResult> {
  const [mainSeries, asOfMonth] = await Promise.all([
    getMainCPISeries(),
    getLatestReleaseMonth(),
  ]);

  const derived = deriveHeadlineChanges(mainSeries);
  const cards: AnswerPart = {
    type: 'stat_cards',
    cards: [
      {
        title: 'Annual CPI',
        value: `${derived.annualChange}%`,
        trend: {
          value: `${Math.abs(derived.annualDelta).toFixed(1)}pp`,
          label: 'vs last month',
          direction: deltaDirection(derived.annualDelta),
        },
      },
      {
        title: 'Quarterly',
        value: `${derived.quarterlyChange}%`,
        trend: {
          value: `${Math.abs(derived.quarterlyDelta).toFixed(1)}pp`,
          label: 'vs prior quarter',
          direction: deltaDirection(derived.quarterlyDelta),
        },
      },
      {
        title: 'Monthly',
        value: `${derived.monthlyChange}%`,
        trend: {
          value: derived.latestMonth ?? '',
          label: 'latest',
          direction: 'neutral',
        },
      },
      {
        title: 'Index value',
        value: derived.latestVal ? derived.latestVal.toFixed(1) : 'n/a',
      },
    ],
  };

  const chart: AnswerPart = {
    type: 'timeseries',
    series: [
      {
        label: 'All groups CPI - Australia',
        points: mainSeries.map((p) => ({
          date: p.date,
          value: parseFloat(p.cpi),
        })),
      },
    ],
  };

  return {
    data: {
      asOfMonth: asOfMonth ?? derived.latestMonth,
      mom: derived.monthlyChange,
      qoq: derived.quarterlyChange,
      yoy: derived.annualChange,
      index: derived.latestVal,
      seriesLength: mainSeries.length,
    },
    ui: [cards, chart],
    asOfMonth: asOfMonth ?? derived.latestMonth,
  };
}

async function handleGetTopMovers(args: GetTopMoversArgs): Promise<ToolResult> {
  const movers =
    args.period === 'yearly'
      ? await getTopYearlyIncreases(args.limit)
      : await getTopMonthlyIncreases(args.limit);

  const rows = movers.map((m) => ({
    item: m.item,
    city: m.city,
    seriesid: m.seriesid,
    pct_change: m.pct_change,
    current_value: m.current_value,
    sparkline: trimSparkline(
      m.timeseries?.map((t) => ({
        publish_date: t.publish_date,
        cpi_value: t.cpi_value,
      })),
      args.sparklinePoints
    ),
  }));

  return {
    data: { period: args.period, rows },
    ui: [{ type: 'top_movers', period: args.period, rows }],
  };
}

async function handleGetAnnualChange(args: GetAnnualChangeArgs): Promise<ToolResult> {
  const map = await getAnnualChangeByItem(args.items, args.city);
  const entries = args.items.map((item) => {
    const row = map.get(item);
    return {
      item,
      city: args.city,
      pct_change: row?.pct_change ?? null,
      current_value: row?.current_value ?? null,
    };
  });

  const cards = entries
    .filter((e) => e.pct_change != null)
    .map((e) => {
      const pct = parseFloat(e.pct_change!);
      return {
        title: e.item,
        value: `${pct.toFixed(1)}%`,
        trend: {
          value: e.city,
          label: 'annual',
          direction: deltaDirection(pct),
        },
      };
    });

  return {
    data: { city: args.city, entries },
    ui: cards.length
      ? [{ type: 'stat_cards', cards }]
      : [{ type: 'text', markdown: 'No annual changes found for the requested items.' }],
  };
}

async function handleGetSeriesStats(args: GetSeriesStatsArgs): Promise<ToolResult> {
  const ui: AnswerPart[] = [];
  const data: Record<string, unknown> = { seriesid: args.seriesid, mode: args.mode };

  if (args.mode === 'statistics' || args.mode === 'both') {
    const stats = await getSeriesStatistics(args.seriesid, args.frequency);
    data.statistics = stats;
    ui.push({
      type: 'stat_cards',
      cards: [
        { title: 'Latest', value: parseFloat(stats.latest).toFixed(1) },
        { title: 'Average', value: parseFloat(stats.avg).toFixed(1) },
        { title: 'Min', value: parseFloat(stats.min).toFixed(1) },
        { title: 'Max', value: parseFloat(stats.max).toFixed(1) },
      ],
    });
  }

  if (args.mode === 'percentage_changes' || args.mode === 'both') {
    const pct = await getPercentageChanges(args.seriesid, args.pctPeriod);
    data.percentageChanges = pct;
    ui.push({
      type: 'timeseries',
      series: [
        {
          label: `${args.pctPeriod} % change`,
          seriesid: args.seriesid,
          points: pct.map((p) => ({
            date: p.publish_date,
            value: parseFloat(p.pct_change),
          })),
        },
      ],
    });
  }

  if (ui.length === 0) {
    ui.push({ type: 'text', markdown: 'No statistics returned.' });
  }

  return { data, ui };
}

async function handleCorrelateSeries(args: CorrelateSeriesArgs): Promise<ToolResult> {
  const seriesList = await getMultipleTimeSeries(args.seriesids, args.frequency);

  if (seriesList.some((s) => s.length === 0)) {
    return {
      data: { error: 'One or more series returned no points' },
      ui: [{ type: 'text', markdown: 'One or more seriesids returned no CPI points.' }],
      error: 'Empty series',
    };
  }

  const { months, values } = alignOnIntersection(
    seriesList as unknown as SeriesRow[][],
    'publish_date',
    'cpi_value'
  );

  if (months.length < MIN_OVERLAP) {
    const msg =
      `The selected series overlap for only ${months.length} month(s); ` +
      `at least ${MIN_OVERLAP} are needed to correlate them`;
    return {
      data: { overlapMonths: months.length, minRequired: MIN_OVERLAP },
      ui: [{ type: 'text', markdown: msg }],
      error: msg,
    };
  }

  const labels = seriesList.map((s, i) => s[0]?.item ?? args.seriesids[i]);
  const arrays = labels.map((item, index) => ({
    item,
    values: values[index],
  }));

  const pairs: Array<{
    indexY: number;
    indexX: number;
    itemY: string;
    itemX: string;
    corr: number;
  }> = [];

  const n = arrays.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v1 = arrays[i].values;
      const v2 = arrays[j].values;
      if (v1.some((v) => isNaN(v)) || v2.some((v) => isNaN(v))) {
        return {
          data: { error: 'Non-numeric CPI values' },
          ui: [{ type: 'text', markdown: 'All CPI values must be valid numbers.' }],
          error: 'Invalid values',
        };
      }
      const corr = calculateCorrelation(v1, v2);
      if (isNaN(corr)) continue;
      pairs.push({
        indexY: i,
        indexX: j,
        itemY: arrays[i].item,
        itemX: arrays[j].item,
        corr,
      });
    }
  }

  return {
    data: {
      categories: labels,
      pairs,
      overlapMonths: months.length,
      seriesids: args.seriesids,
    },
    ui: [
      {
        type: 'correlation_matrix',
        labels,
        pairs,
        overlapMonths: months.length,
      },
    ],
  };
}

type HandlerMap = {
  [K in ChatToolName]: (args: unknown) => Promise<ToolResult>;
};

export const chatHandlers: HandlerMap = {
  search_cpi_series: (args) =>
    handleSearchCpiSeries(args as SearchCpiSeriesArgs),
  resolve_series: (args) => handleResolveSeries(args as ResolveSeriesArgs),
  get_cpi_timeseries: (args) =>
    handleGetCpiTimeseries(args as GetCpiTimeseriesArgs),
  compare_item_across_cities: (args) =>
    handleCompareItemAcrossCities(args as CompareItemAcrossCitiesArgs),
  get_headline_cpi: () => handleGetHeadlineCpi(),
  get_top_movers: (args) => handleGetTopMovers(args as GetTopMoversArgs),
  get_annual_change: (args) =>
    handleGetAnnualChange(args as GetAnnualChangeArgs),
  get_series_stats: (args) => handleGetSeriesStats(args as GetSeriesStatsArgs),
  correlate_series: (args) =>
    handleCorrelateSeries(args as CorrelateSeriesArgs),
};
