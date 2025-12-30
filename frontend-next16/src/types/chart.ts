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
}

/**
 * Bar Chart Props
 */
export interface BarChartProps {
  data: CorrelationData[] | ChartDataPoint[];
  scale?: 'linear' | 'logarithmic';
  height?: number;
  className?: string;
}

/**
 * Heatmap Chart Data
 */
export interface HeatmapData {
  data: CorrelationData[];
  categories: string[];
}

/**
 * Heatmap Chart Props
 */
export interface HeatmapChartProps {
  chartData: HeatmapData;
  width?: number;
  height?: number;
  className?: string;
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
 * Highcharts Series Data
 */
export interface HighchartsSeriesData {
  name: string;
  data: Array<[string | number, number]>;
  color?: string;
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
