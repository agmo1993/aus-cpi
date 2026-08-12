/**
 * Statistics Queries
 * Typed database queries for CPI statistics and top movers
 */

import { query } from '../db';
import { NATIONAL_CITY } from './cpi';
import { TopMover, TimeSeriesDataPoint } from '@/types';

/**
 * Top movers are ranked over national series only.
 *
 * Every item is published for all nine locations, so ranking across the whole
 * lookup lets a single volatile item occupy several slots at once (the same
 * category in Melbourne, Hobart and Brisbane) and puts the national weighted
 * average in competition with the eight cities it is computed from.
 */
const TOP_MOVER_CITY = NATIONAL_CITY;

/**
 * Get top monthly price increases, nationally
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
       AND city = $2
     ORDER BY publish_date DESC, percentage_change DESC
     LIMIT $1`,
    [limit, TOP_MOVER_CITY]
  );

  // Get timeseries for each top mover
  const topMovers = await Promise.all(
    result.rows.map(async (row) => {
      // Get timeseries for sparkline (last 12 months)
      const timeseriesResult = await query<TimeSeriesDataPoint>(
        // t.publish_date, not the output alias of the same name: ordering on
        // the alias sorts 'mm-yyyy' as text, which returns one December per
        // year instead of the last twelve months.
        `SELECT TO_CHAR(t.publish_date, 'mm-yyyy') as publish_date, t.cpi_value, t.item
         FROM auscpi.cpi_index_monthly t
         WHERE t.seriesid = $1
         ORDER BY t.publish_date DESC
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
 * Get top yearly price increases, nationally
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
       AND city = $2
     ORDER BY publish_date DESC, percentage_change DESC
     LIMIT $1`,
    [limit, TOP_MOVER_CITY]
  );

  // Get timeseries for each top mover
  const topMovers = await Promise.all(
    result.rows.map(async (row) => {
      // Get timeseries for sparkline (last 24 months for yearly view)
      const timeseriesResult = await query<TimeSeriesDataPoint>(
        `SELECT TO_CHAR(t.publish_date, 'mm-yyyy') as publish_date, t.cpi_value, t.item
         FROM auscpi.cpi_index_monthly t
         WHERE t.seriesid = $1
         ORDER BY t.publish_date DESC
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
 * Get the latest annual percentage change for named items in one city
 * @param items - Item names as published by the ABS, e.g. 'Electricity'
 * @param city - The city, or 'Australia' for the eight-capital-city average
 * @returns Map of item name to its most recent annual change
 */
export async function getAnnualChangeByItem(
  items: string[],
  city: string = 'Australia'
): Promise<Map<string, { pct_change: string; current_value: string }>> {
  const result = await query<{
    item: string;
    pct_change: string;
    current_value: string;
  }>(
    `SELECT DISTINCT ON (item)
       item, percentage_change AS pct_change, current_value
     FROM auscpi.cpi_pct_yearly_base2017
     WHERE city = $1
       AND item = ANY($2)
       AND percentage_change IS NOT NULL
     ORDER BY item, publish_date DESC`,
    [city, items]
  );

  return new Map(
    result.rows.map((row) => [
      row.item,
      { pct_change: row.pct_change, current_value: row.current_value },
    ])
  );
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
    `SELECT TO_CHAR(v.publish_date, 'mm-yyyy') as publish_date, v.percentage_change AS pct_change, v.item
     FROM ${view} v
     WHERE v.seriesid = $1
     ORDER BY v.publish_date ASC`,
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
