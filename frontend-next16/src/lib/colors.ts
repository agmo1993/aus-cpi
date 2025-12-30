/**
 * AusCPI Color Palette
 * Ported from the original frontend color scheme
 */

export const colors = {
  primary: "#ECEEE6",
  secondary: "#3cad92",
  success: "#7596AD",
  danger: "#7D8A8E",
  warning: "#ffc107",
  info: "#242D42",
  light: "#f8f9fa",
  dark: "#343a40",
  black: "#000",
  white: "#fff",
} as const;

/**
 * Chart colors for multi-line visualizations
 * Ported from linePlotColors.js
 */
export const chartColors = {
  blue: "#1f77b4",
  green: "#2ca02c",
  red: "#d62728",
  purple: "#9467bd",
  orange: "#ff7f0e",
  teal: "#17becf",
  pink: "#e377c2",
  brown: "#8c564b",
  gray: "#7f7f7f",
  black: "#000000",
} as const;

/**
 * Ordered array of chart colors for multi-series charts
 */
export const chartColorArray = [
  chartColors.blue,
  chartColors.green,
  chartColors.red,
  chartColors.purple,
  chartColors.orange,
  chartColors.teal,
  chartColors.pink,
  chartColors.brown,
  chartColors.gray,
  chartColors.black,
] as const;

/**
 * Get a chart color by index (cycles through colors if index > 9)
 */
export function getChartColor(index: number): string {
  return chartColorArray[index % chartColorArray.length];
}
