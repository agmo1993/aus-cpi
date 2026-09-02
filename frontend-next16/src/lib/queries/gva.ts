/**
 * Industry GVA queries (ABS 5206.0 Table 6).
 */

import { query } from '../db';
import type { TimeSeriesDataPoint } from '@/types';
import type { GvaSeries } from '@/lib/gva-label';

export type { GvaSeries } from '@/lib/gva-label';
export { gvaLabel } from '@/lib/gva-label';

/** Level series only: drop % change, contribution and revision rows. */
export async function getGvaSeries(): Promise<GvaSeries[]> {
  const result = await query<GvaSeries>(
    `SELECT seriesid, industry, subdivision, series_type
       FROM auscpi.gva_series_lookup
      WHERE series_type = 'Seasonally Adjusted'
        AND industry NOT ILIKE '%percentage%'
        AND industry NOT ILIKE '%contribution%'
        AND industry NOT ILIKE '%revision%'
      ORDER BY industry ASC, subdivision ASC NULLS FIRST`
  );
  return result.rows;
}

export async function getGvaTimeSeries(
  seriesId: string
): Promise<TimeSeriesDataPoint[]> {
  const result = await query<TimeSeriesDataPoint>(
    `SELECT TO_CHAR(t.publish_date, 'mm-yyyy') AS publish_date,
            t.gva_value::text AS cpi_value,
            COALESCE(l.subdivision, l.industry) AS item
       FROM auscpi.industry_gva_quarterly t
       JOIN auscpi.gva_series_lookup l ON l.seriesid = t.seriesid
      WHERE t.seriesid = $1
      ORDER BY t.publish_date ASC`,
    [seriesId]
  );
  return result.rows;
}
