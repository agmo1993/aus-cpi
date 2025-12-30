/**
 * API Types
 * Request and response types for API routes
 */

import { TimeSeriesDataPoint, CorrelationData, CPICategory, TopMover } from './cpi';

/**
 * GET /api/timeseries/[seriesid]
 * Fetch monthly CPI time series data
 */
export type TimeSeriesResponse = TimeSeriesDataPoint[];

/**
 * GET /api/timeseriesqtl/[seriesid]
 * Fetch quarterly CPI time series data
 */
export type TimeSeriesQuarterlyResponse = TimeSeriesDataPoint[];

/**
 * POST /api/correlate
 * Request body: Array of time series data
 */
export type CorrelateRequest = TimeSeriesDataPoint[][];

/**
 * POST /api/correlate
 * Response: Correlation data and categories
 */
export interface CorrelateResponse {
  data: CorrelationData[];
  categories: string[];
}

/**
 * GET /api/monthlyCPI
 * Response: Monthly CPI values for main series
 */
export interface MonthlyCPIResponse {
  [seriesName: string]: Array<{
    date: string;
    cpi: string;
  }>;
}

/**
 * GET /api/lookupMonthly
 * Response: Monthly CPI categories
 */
export type LookupMonthlyResponse = CPICategory[];

/**
 * GET /api/lookupQuarterly
 * Response: Quarterly CPI categories
 */
export type LookupQuarterlyResponse = CPICategory[];

/**
 * GET /api/topIncreaseMonthly
 * Response: Top 5 monthly price increases
 */
export interface TopIncreaseMonthlyResponse {
  topMovers: TopMover[];
}

/**
 * GET /api/topIncreaseYearly
 * Response: Top 5 yearly price increases
 */
export interface TopIncreaseYearlyResponse {
  topMovers: TopMover[];
}

/**
 * API Error Response
 */
export interface APIError {
  error: string;
  message?: string;
  statusCode?: number;
}

/**
 * Generic API Response wrapper
 */
export type APIResponse<T> = T | APIError;

/**
 * Type guard to check if response is an error
 */
export function isAPIError(response: any): response is APIError {
  return response && typeof response === 'object' && 'error' in response;
}
