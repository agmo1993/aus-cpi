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
    // Ordered on t.publish_date, not the output column of the same name:
    // ORDER BY resolves output aliases first, so an unqualified reference
    // would sort the 'mm-yyyy' text and put January 2018 before September 2017.
    `SELECT TO_CHAR(t.publish_date, 'mm-yyyy') as publish_date, t.cpi_value, t.item
     FROM auscpi.cpi_index_monthly t
     WHERE t.seriesid = $1
     ORDER BY t.publish_date ASC`,
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
    `SELECT TO_CHAR(t.publish_date, 'mm-yyyy') as publish_date, t.cpi_value, t.item
     FROM auscpi.cpi_index t
     WHERE t.seriesid = $1
     ORDER BY t.publish_date ASC`,
    [seriesId]
  );

  return result.rows;
}

/**
 * The headline series: All groups CPI for the weighted average of eight
 * capital cities, which the ABS publishes under the location 'Australia'.
 *
 * Resolved by item and city rather than by series ID. The ABS reissued the
 * monthly series IDs when it moved to the complete monthly CPI, and the
 * previously hardcoded A128478317T no longer exists in any published table.
 */
export const HEADLINE_ITEM = 'All groups CPI';
export const NATIONAL_CITY = 'Australia';

/**
 * Get the main CPI index series (All groups CPI, Australia)
 * @returns Array of monthly CPI values
 */
export async function getMainCPISeries(): Promise<
  Array<{ date: string; cpi: string }>
> {
  const result = await query<{ date: string; cpi: string }>(
    `SELECT TO_CHAR(publish_date, 'mm-yyyy') as date, cpi_value as cpi
     FROM auscpi.cpi_index_monthly
     WHERE item = $1 AND city = $2
     ORDER BY publish_date ASC`,
    [HEADLINE_ITEM, NATIONAL_CITY]
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
        `SELECT TO_CHAR(t.publish_date, 'mm-yyyy') as publish_date, t.cpi_value, t.item
         FROM ${table} t
         WHERE t.seriesid = $1
         ORDER BY t.publish_date ASC`,
        [seriesId]
      );
      return result.rows;
    })
  );

  return results;
}

/**
 * Latest published month for the headline national series, as 'mm-yyyy'.
 * Used for site footer attribution without hardcoding a release month.
 */
export async function getLatestReleaseMonth(): Promise<string | null> {
  const result = await query<{ date: string }>(
    `SELECT TO_CHAR(publish_date, 'mm-yyyy') as date
     FROM auscpi.cpi_index_monthly
     WHERE item = $1 AND city = $2
     ORDER BY publish_date DESC
     LIMIT 1`,
    [HEADLINE_ITEM, NATIONAL_CITY]
  );
  return result.rows[0]?.date ?? null;
}
