/**
 * CPI Data Queries
 * Typed database queries for CPI data
 */

import { query } from '../db';
import { CPIIndexMonthly, CPIIndex, TimeSeriesDataPoint } from '@/types';

/**
 * Get monthly CPI time series for a specific series ID
 * @param seriesId - The series identifier
 * @returns Array of time series data points
 */
export async function getMonthlyTimeSeries(
  seriesId: string
): Promise<TimeSeriesDataPoint[]> {
  const result = await query<TimeSeriesDataPoint>(
    `SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, item
     FROM auscpi.cpi_index_monthly
     WHERE seriesid = $1
     ORDER BY publish_date ASC`,
    [seriesId]
  );

  return result.rows;
}

/**
 * Get quarterly CPI time series for a specific series ID
 * @param seriesId - The series identifier
 * @returns Array of time series data points
 */
export async function getQuarterlyTimeSeries(
  seriesId: string
): Promise<TimeSeriesDataPoint[]> {
  const result = await query<TimeSeriesDataPoint>(
    `SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, item
     FROM auscpi.cpi_index
     WHERE seriesid = $1
     ORDER BY publish_date ASC`,
    [seriesId]
  );

  return result.rows;
}

/**
 * Get the main CPI index series (A128478317T - All groups CPI, Australia)
 * @returns Array of monthly CPI values
 */
export async function getMainCPISeries(): Promise<
  Array<{ date: string; cpi: string }>
> {
  const result = await query<{ date: string; cpi: string }>(
    `SELECT TO_CHAR(publish_date, 'mm-yyyy') as date, cpi_value as cpi
     FROM auscpi.cpi_index_monthly
     WHERE seriesid = $1
     ORDER BY publish_date ASC`,
    ['A128478317T']
  );

  return result.rows;
}

/**
 * Get all monthly CPI data for a specific date
 * @param publishDate - The publication date
 * @returns Array of CPI index entries
 */
export async function getMonthlyCPIByDate(
  publishDate: Date
): Promise<CPIIndexMonthly[]> {
  const result = await query<CPIIndexMonthly>(
    `SELECT publish_date, seriesid, cpi_value, item, city
     FROM auscpi.cpi_index_monthly
     WHERE publish_date = $1`,
    [publishDate]
  );

  return result.rows;
}

/**
 * Get all quarterly CPI data for a specific date
 * @param publishDate - The publication date
 * @returns Array of CPI index entries
 */
export async function getQuarterlyCPIByDate(
  publishDate: Date
): Promise<CPIIndex[]> {
  const result = await query<CPIIndex>(
    `SELECT publish_date, seriesid, cpi_value, item, city
     FROM auscpi.cpi_index
     WHERE publish_date = $1`,
    [publishDate]
  );

  return result.rows;
}

/**
 * Get CPI data for multiple series IDs
 * @param seriesIds - Array of series identifiers
 * @param frequency - Data frequency (monthly or quarterly)
 * @returns Array of time series data grouped by series
 */
export async function getMultipleTimeSeries(
  seriesIds: string[],
  frequency: 'monthly' | 'quarterly' = 'monthly'
): Promise<TimeSeriesDataPoint[][]> {
  const table =
    frequency === 'monthly'
      ? 'auscpi.cpi_index_monthly'
      : 'auscpi.cpi_index';

  const results = await Promise.all(
    seriesIds.map(async (seriesId) => {
      const result = await query<TimeSeriesDataPoint>(
        `SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, item
         FROM ${table}
         WHERE seriesid = $1
         ORDER BY publish_date ASC`,
        [seriesId]
      );
      return result.rows;
    })
  );

  return results;
}
