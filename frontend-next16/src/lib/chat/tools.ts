/**
 * Chat tool catalog metadata.
 * Describes each tool for a future LLM router; no DB I/O here.
 */

import type { z } from 'zod';
import {
  searchCpiSeriesArgsSchema,
  resolveSeriesArgsSchema,
  getCpiTimeseriesArgsSchema,
  getHeadlineCpiArgsSchema,
  getTopMoversArgsSchema,
  getAnnualChangeArgsSchema,
  getSeriesStatsArgsSchema,
  correlateSeriesArgsSchema,
  type AnswerPart,
} from './schema';

/** UI component a future chat renderer should mount for a part type. */
export type UiComponentName =
  | 'StatCard'
  | 'MultiLineChart'
  | 'LineChart'
  | 'TopMovers'
  | 'CorrelationMatrix'
  | 'SeriesList'
  | 'Markdown';

export interface ChatToolDef<TSchema extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  argsSchema: TSchema;
  /** AnswerPart.type values this tool typically emits. */
  resultPartTypes: AnswerPart['type'][];
  /** Suggested React component per part type. */
  uiComponents: Partial<Record<AnswerPart['type'], UiComponentName>>;
}

export const CHAT_TOOLS = {
  search_cpi_series: {
    name: 'search_cpi_series',
    description:
      'Search ABS CPI series by item name (case-insensitive partial match). Returns labelled series for selection.',
    argsSchema: searchCpiSeriesArgsSchema,
    resultPartTypes: ['series_list'],
    uiComponents: { series_list: 'SeriesList' },
  },
  resolve_series: {
    name: 'resolve_series',
    description:
      'Resolve a CPI series by seriesid, or by item + city (default Australia). Prefer this before fetching timeseries.',
    argsSchema: resolveSeriesArgsSchema,
    resultPartTypes: ['series_list', 'text'],
    uiComponents: { series_list: 'SeriesList', text: 'Markdown' },
  },
  get_cpi_timeseries: {
    name: 'get_cpi_timeseries',
    description:
      'Fetch a CPI index series (monthly or quarterly). Optional from/to in mm-yyyy slices the result in JS.',
    argsSchema: getCpiTimeseriesArgsSchema,
    resultPartTypes: ['timeseries'],
    uiComponents: { timeseries: 'MultiLineChart' },
  },
  get_headline_cpi: {
    name: 'get_headline_cpi',
    description:
      'Headline All groups CPI for Australia: latest index, MoM, QoQ, YoY (same arithmetic as the home page), and as-of month.',
    argsSchema: getHeadlineCpiArgsSchema,
    resultPartTypes: ['stat_cards', 'timeseries'],
    uiComponents: { stat_cards: 'StatCard', timeseries: 'LineChart' },
  },
  get_top_movers: {
    name: 'get_top_movers',
    description:
      'Largest national CPI movers for the latest release, monthly or yearly, with sparkline points.',
    argsSchema: getTopMoversArgsSchema,
    resultPartTypes: ['top_movers'],
    uiComponents: { top_movers: 'TopMovers' },
  },
  get_annual_change: {
    name: 'get_annual_change',
    description:
      'Latest annual percentage change for named ABS items in one city (default Australia).',
    argsSchema: getAnnualChangeArgsSchema,
    resultPartTypes: ['stat_cards'],
    uiComponents: { stat_cards: 'StatCard' },
  },
  get_series_stats: {
    name: 'get_series_stats',
    description:
      'Summary statistics (min/max/avg/latest) and/or percentage-change history for a seriesid.',
    argsSchema: getSeriesStatsArgsSchema,
    resultPartTypes: ['stat_cards', 'timeseries', 'text'],
    uiComponents: {
      stat_cards: 'StatCard',
      timeseries: 'LineChart',
      text: 'Markdown',
    },
  },
  correlate_series: {
    name: 'correlate_series',
    description:
      'Pearson correlation across two or more seriesids (intersection alignment, min 12 overlapping months).',
    argsSchema: correlateSeriesArgsSchema,
    resultPartTypes: ['correlation_matrix', 'text'],
    uiComponents: { correlation_matrix: 'CorrelationMatrix', text: 'Markdown' },
  },
} as const satisfies Record<string, ChatToolDef>;

export type ChatToolName = keyof typeof CHAT_TOOLS;

export const CHAT_TOOL_NAMES = Object.keys(CHAT_TOOLS) as ChatToolName[];
