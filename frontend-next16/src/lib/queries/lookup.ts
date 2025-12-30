/**
 * Lookup Table Queries
 * Typed database queries for series lookup data
 */

import { query } from '../db';
import { SeriesLookup, CPICategory } from '@/types';

/**
 * Get all monthly CPI categories/series
 * @returns Array of CPI categories with monthly frequency
 */
export async function getMonthlyCategories(): Promise<SeriesLookup[]> {
  const result = await query<SeriesLookup>(
    `SELECT seriesid, item, city, data_frequency
     FROM auscpi.seriesid_lookup
     WHERE data_frequency = $1
     ORDER BY item ASC, city ASC`,
    ['Monthly']
  );

  return result.rows;
}

/**
 * Get all quarterly CPI categories/series
 * @returns Array of CPI categories with quarterly frequency
 */
export async function getQuarterlyCategories(): Promise<SeriesLookup[]> {
  const result = await query<SeriesLookup>(
    `SELECT seriesid, item, city, data_frequency
     FROM auscpi.seriesid_lookup
     WHERE data_frequency = $1
     ORDER BY item ASC, city ASC`,
    ['Quarterly']
  );

  return result.rows;
}

/**
 * Get series lookup by series ID
 * @param seriesId - The series identifier
 * @returns Series lookup entry or null if not found
 */
export async function getSeriesById(
  seriesId: string
): Promise<SeriesLookup | null> {
  const result = await query<SeriesLookup>(
    `SELECT seriesid, item, city, data_frequency
     FROM auscpi.seriesid_lookup
     WHERE seriesid = $1`,
    [seriesId]
  );

  return result.rows[0] || null;
}

/**
 * Get all series for a specific city
 * @param city - The city name
 * @param frequency - Optional data frequency filter
 * @returns Array of series for the specified city
 */
export async function getSeriesByCity(
  city: string,
  frequency?: 'Monthly' | 'Quarterly'
): Promise<SeriesLookup[]> {
  let sql = `SELECT seriesid, item, city, data_frequency
             FROM auscpi.seriesid_lookup
             WHERE city = $1`;

  const params: any[] = [city];

  if (frequency) {
    sql += ` AND data_frequency = $2`;
    params.push(frequency);
  }

  sql += ` ORDER BY item ASC`;

  const result = await query<SeriesLookup>(sql, params);
  return result.rows;
}

/**
 * Get all series for a specific item/category
 * @param item - The item/category name
 * @param frequency - Optional data frequency filter
 * @returns Array of series for the specified item
 */
export async function getSeriesByItem(
  item: string,
  frequency?: 'Monthly' | 'Quarterly'
): Promise<SeriesLookup[]> {
  let sql = `SELECT seriesid, item, city, data_frequency
             FROM auscpi.seriesid_lookup
             WHERE item = $1`;

  const params: any[] = [item];

  if (frequency) {
    sql += ` AND data_frequency = $2`;
    params.push(frequency);
  }

  sql += ` ORDER BY city ASC`;

  const result = await query<SeriesLookup>(sql, params);
  return result.rows;
}

/**
 * Search series by item name (case-insensitive partial match)
 * @param searchTerm - The search term
 * @param frequency - Optional data frequency filter
 * @returns Array of matching series
 */
export async function searchSeries(
  searchTerm: string,
  frequency?: 'Monthly' | 'Quarterly'
): Promise<SeriesLookup[]> {
  let sql = `SELECT seriesid, item, city, data_frequency
             FROM auscpi.seriesid_lookup
             WHERE LOWER(item) LIKE LOWER($1)`;

  const params: any[] = [`%${searchTerm}%`];

  if (frequency) {
    sql += ` AND data_frequency = $2`;
    params.push(frequency);
  }

  sql += ` ORDER BY item ASC, city ASC`;

  const result = await query<SeriesLookup>(sql, params);
  return result.rows;
}
