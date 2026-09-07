/**
 * Chart Component Types
 * Props and data types for chart components
 */

import { TimeSeriesDataPoint, CorrelationData } from './cpi';

/**
 * Base chart data point
 */
export interface ChartDataPoint {
  [key: string]: string | number | Date;
}

/**
 * Line Chart Props (Single Line)
 */
export interface LineChartProps {
  data: TimeSeriesDataPoint[] | ChartDataPoint[];
  xaxis: string;
  yaxis: string;
  chartTitle?: string | null;
  height?: number;
  marginTop?: number;
  className?: string;
}

/**
 * Multi-Line Chart Props (Multiple Series)
 */
export interface MultiLineChartProps {
  data: TimeSeriesDataPoint[][] | ChartDataPoint[][];
  xaxis: string;
  yaxis: string;
  chartTitle?: string | null;
  height?: number;
  marginTop?: number;
  className?: string;
  /**
   * One legend label per series. Without these the chart falls back to each
   * series' `item`, which repeats across cities: comparing the same item in
   * three cities produces three identically named lines.
   */
  seriesNames?: string[];
  /** Y-axis label; default "Index". */
  yAxisLabel?: string;
  /** Appended in tooltip/ticks, e.g. "%". */
  valueSuffix?: string;
}

/**
 * Sparkline Chart Props (Inline mini charts)
 */
export interface SparklineChartProps {
  data: Array<{
    publish_date: string;
    cpi_value: string;
  }>;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

/**
 * Chart Configuration
 */
export interface ChartConfig {
  colors: string[];
  theme: 'light' | 'dark';
  animation: boolean;
  responsive: boolean;
}

/**
 * Recharts (shadcn) Chart Data Point
 */
export interface RechartsDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

/**
 * Chart Tooltip Data
 */
export interface ChartTooltipData {
  label: string;
  value: string | number;
  color?: string;
  formatted?: string;
}

/**
 * Chart Legend Item
 */
export interface ChartLegendItem {
  name: string;
  color: string;
  visible: boolean;
}

/**
 * Chart Export Options
 */
export interface ChartExportOptions {
  filename: string;
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  width?: number;
  height?: number;
}
