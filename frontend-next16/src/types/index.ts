/**
 * Type Definitions Index
 * Central export for all TypeScript types
 */

// Database types
export type {
  CPIIndex,
  CPIIndexMonthly,
  WPIIndex,
  SeriesLookup,
  CPIPercentageChange,
} from './database';

// CPI business logic types
export type {
  TimeSeriesDataPoint,
  TimeSeriesQuarterlyDataPoint,
  CPICategory,
  TopMover,
  CorrelationData,
  CorrelationResponse,
  CorrelationArrayItem,
  ChartSeries,
  MultiLineChartData,
  DataFrequency,
  CPIValue,
  MonthlyCPIResponse,
} from './cpi';

// API types
export type {
  TimeSeriesResponse,
  TimeSeriesQuarterlyResponse,
  CorrelateRequest,
  CorrelateResponse,
  LookupMonthlyResponse,
  LookupQuarterlyResponse,
  TopIncreaseMonthlyResponse,
  TopIncreaseYearlyResponse,
  APIError,
  APIResponse,
} from './api';

export { isAPIError } from './api';

// Chart types
export type {
  ChartDataPoint,
  LineChartProps,
  MultiLineChartProps,
  BarChartProps,
  HeatmapData,
  HeatmapChartProps,
  SparklineChartProps,
  ChartConfig,
  RechartsDataPoint,
  HighchartsSeriesData,
  ChartTooltipData,
  ChartLegendItem,
  ChartExportOptions,
} from './chart';
