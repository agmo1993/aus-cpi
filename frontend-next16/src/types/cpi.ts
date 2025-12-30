/**
 * CPI Data Types
 * Business logic types for CPI data handling
 */

/**
 * Time series data point (as returned by API)
 */
export interface TimeSeriesDataPoint {
  publish_date: string; // Format: 'mm-yyyy'
  cpi_value: string;
  item: string;
}

/**
 * Quarterly time series data point
 */
export interface TimeSeriesQuarterlyDataPoint {
  publish_date: string; // Format: 'mm-yyyy'
  cpi_value: string;
  item: string;
}

/**
 * Category/Series information for selection
 */
export interface CPICategory {
  seriesid: string;
  item: string;
  city: string;
  data_frequency?: string;
}

/**
 * Top movers data structure (for monthly/yearly gainers)
 */
export interface TopMover {
  item: string;
  city: string;
  seriesid: string;
  pct_change: string;
  current_value: string;
  timeseries?: TimeSeriesDataPoint[]; // For sparklines
}

/**
 * Correlation data structure
 */
export interface CorrelationData {
  itemY: string;
  itemX: string;
  corr: number; // Pearson correlation coefficient (-1 to 1)
}

/**
 * Correlation response with categories
 */
export interface CorrelationResponse {
  data: CorrelationData[];
  categories: string[];
}

/**
 * Array item for correlation calculation
 */
export interface CorrelationArrayItem {
  item: string;
  values: number[];
}

/**
 * Chart data series
 */
export interface ChartSeries {
  name: string;
  data: TimeSeriesDataPoint[];
  color?: string;
}

/**
 * Multi-line chart data
 */
export interface MultiLineChartData {
  series: ChartSeries[];
  xAxisKey: string;
  yAxisKey: string;
}

/**
 * Data frequency types
 */
export type DataFrequency = 'monthly' | 'quarterly';

/**
 * CPI value with metadata
 */
export interface CPIValue {
  date: string;
  cpi: string;
}

/**
 * Monthly CPI response (for home page)
 */
export interface MonthlyCPIResponse {
  [seriesName: string]: CPIValue[];
}
