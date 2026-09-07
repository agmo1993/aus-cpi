/**
 * BLS CPI queries
 * ABS↔BLS category crosswalk and US city-average index series.
 */

import { query } from '../db';
import type { TimeSeriesDataPoint } from '@/types';

export interface CrosswalkRow {
  abs_item: string;
  bls_item_code: string;
  bls_item_name: string | null;
  match_quality: 'exact' | 'close' | 'broader' | 'narrower' | 'unmapped';
  notes: string | null;
}

export interface CrosswalkWithData extends CrosswalkRow {
  has_data: boolean;
}

/**
 * Best ABS→BLS crosswalk row for an ABS item name.
 * Prefers exact over close; ignores unmapped / broader / narrower and _UNMAPPED.
 */
export async function getCrosswalkForAbsItem(
  absItem: string
): Promise<CrosswalkRow | null> {
  const result = await query<CrosswalkRow>(
    `SELECT abs_item, bls_item_code, bls_item_name, match_quality, notes
     FROM auscpi.cpi_category_crosswalk
     WHERE abs_item = $1
       AND match_quality IN ('exact', 'close')
       AND bls_item_code <> '_UNMAPPED'
     ORDER BY CASE match_quality WHEN 'exact' THEN 0 ELSE 1 END,
              bls_item_code ASC
     LIMIT 1`,
    [absItem]
  );
  return result.rows[0] ?? null;
}

/**
 * BLS CPI-U index as TimeSeriesDataPoint[] for a CU item_code (e.g. SA0).
 */
export async function getBlsTimeSeriesByItemCode(
  itemCode: string
): Promise<TimeSeriesDataPoint[]> {
  const result = await query<TimeSeriesDataPoint>(
    `SELECT TO_CHAR(i.publish_date, 'mm-yyyy') AS publish_date,
            i.value::text AS cpi_value,
            s.item_name AS item,
            'United States' AS city
     FROM auscpi.bls_cpi_index i
     JOIN auscpi.bls_series s ON s.series_id = i.series_id
     WHERE s.item_code = $1
     ORDER BY i.publish_date ASC`,
    [itemCode]
  );
  return result.rows;
}

/**
 * Whether any BLS index rows exist for this item_code.
 */
export async function hasBlsDataForItemCode(itemCode: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM auscpi.bls_cpi_index i
       JOIN auscpi.bls_series s ON s.series_id = i.series_id
       WHERE s.item_code = $1
     ) AS exists`,
    [itemCode]
  );
  return result.rows[0]?.exists ?? false;
}

/**
 * Crosswalk lookup with has_data flag for the UI toggle.
 */
export async function getCrosswalkWithDataForAbsItem(
  absItem: string
): Promise<CrosswalkWithData | null> {
  const row = await getCrosswalkForAbsItem(absItem);
  if (!row) return null;
  const has_data = await hasBlsDataForItemCode(row.bls_item_code);
  return { ...row, has_data };
}
