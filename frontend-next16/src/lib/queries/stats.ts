/**
 * Statistics Queries
 * Typed database queries for CPI statistics and top movers
 */

import { query } from '../db';
import { TopMover, TimeSeriesDataPoint } from '@/types';

/**
 * Get top monthly price increases
 * @param limit - Number of results to return (default: 5)
 * @returns Array of top monthly movers with percentage changes
 */
export async function getTopMonthlyIncreases(
  limit: number = 5
): Promise<TopMover[]> {
  const result = await query<{
    item: string;
    city: string;
    seriesid: string;
    pct_change: string;
    current_value: string;
  }>(
    `SELECT item, city, seriesid, percentage_change AS pct_change, current_value
     FROM auscpi.cpi_pct_monthly
     WHERE percentage_change IS NOT NULL
     ORDER BY publish_date DESC, percentage_change DESC
     LIMIT $1`,
    [limit]
  );

  // Get timeseries for each top mover
  const topMovers = await Promise.all(
    result.rows.map(async (row) => {
      // Get timeseries for sparkline (last 12 months)
      const timeseriesResult = await query<TimeSeriesDataPoint>(
        `SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, item
         FROM auscpi.cpi_index_monthly
         WHERE seriesid = $1
         ORDER BY publish_date DESC
         LIMIT 12`,
        [row.seriesid]
      );

      return {
        ...row,
        timeseries: timeseriesResult.rows.reverse(), // Reverse to chronological order
      };
    })
  );

  return topMovers;
}

/**
 * Get top yearly price increases
 * @param limit - Number of results to return (default: 5)
 * @returns Array of top yearly movers with percentage changes
 */
export async function getTopYearlyIncreases(
  limit: number = 5
): Promise<TopMover[]> {
  const result = await query<{
    item: string;
    city: string;
    seriesid: string;
    percentage_change: string;
    current_value: string;
  }>(
    `SELECT item, city, seriesid, percentage_change, current_value
     FROM auscpi.cpi_pct_yearly_base2017
     WHERE percentage_change IS NOT NULL
     ORDER BY publish_date DESC, percentage_change DESC
     LIMIT $1`,
    [limit]
  );

  // Get timeseries for each top mover
  const topMovers = await Promise.all(
    result.rows.map(async (row) => {
      // Get timeseries for sparkline (last 24 months for yearly view)
      const timeseriesResult = await query<TimeSeriesDataPoint>(
        `SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, item
         FROM auscpi.cpi_index_monthly
         WHERE seriesid = $1
         ORDER BY publish_date DESC
         LIMIT 24`,
        [row.seriesid]
      );

      return {
        item: row.item,
        city: row.city,
        seriesid: row.seriesid,
        pct_change: row.percentage_change, // Map to expected field name
        current_value: row.current_value,
        timeseries: timeseriesResult.rows.reverse(), // Reverse to chronological order
      };
    })
  );

  return topMovers;
}

/**
 * Get percentage change for a specific series and time period
 * @param seriesId - The series identifier
 * @param period - The time period ('monthly' | 'quarterly' | 'yearly')
 * @returns Array of percentage changes over time
 */
export async function getPercentageChanges(
  seriesId: string,
  period: 'monthly' | 'quarterly' | 'yearly'
): Promise<
  Array<{
    publish_date: string;
    pct_change: string;
    item: string;
  }>
> {
  const viewMap = {
    monthly: 'auscpi.cpi_pct_monthly',
    quarterly: 'auscpi.cpi_pct_quarterly',
    yearly: 'auscpi.cpi_pct_yearly',
  };

  const view = viewMap[period];

  const result = await query<{
    publish_date: string;
    pct_change: string;
    item: string;
  }>(
    `SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, percentage_change AS pct_change, item
     FROM ${view}
     WHERE seriesid = $1
     ORDER BY publish_date ASC`,
    [seriesId]
  );

  return result.rows;
}

/**
 * Get summary statistics for a series
 * @param seriesId - The series identifier
 * @param frequency - Data frequency ('monthly' | 'quarterly')
 * @returns Summary statistics (min, max, avg, latest)
 */
export async function getSeriesStatistics(
  seriesId: string,
  frequency: 'monthly' | 'quarterly' = 'monthly'
): Promise<{
  min: string;
  max: string;
  avg: string;
  latest: string;
  count: number;
}> {
  const table =
    frequency === 'monthly'
      ? 'auscpi.cpi_index_monthly'
      : 'auscpi.cpi_index';

  const result = await query<{
    min: string;
    max: string;
    avg: string;
    latest: string;
    count: string;
  }>(
    `SELECT
       MIN(cpi_value::numeric) as min,
       MAX(cpi_value::numeric) as max,
       AVG(cpi_value::numeric) as avg,
       (SELECT cpi_value FROM ${table} WHERE seriesid = $1 ORDER BY publish_date DESC LIMIT 1) as latest,
       COUNT(*) as count
     FROM ${table}
     WHERE seriesid = $1`,
    [seriesId]
  );

  return {
    ...result.rows[0],
    count: parseInt(result.rows[0].count),
  };
}
