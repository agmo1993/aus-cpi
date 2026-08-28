/**
 * Weighting Pattern Queries
 *
 * Reads auscpi.cpi_weights_by_city and the index levels needed to rebuild a
 * CPI from a subset of the basket. The method, and why the link period is a
 * column rather than a constant, is written up in
 * backend/docs/cpi-index-from-weights.md.
 */

import { query } from '../db';
import { HEADLINE_ITEM } from './cpi';
import { buildTree } from '../basket';
import type { BasketInputs, WeightRow } from '@/types/basket';

/**
 * The basket is aggregated from expenditure classes, the finest level the ABS
 * publishes. Aggregating from the 11 groups is just as accurate (the error is
 * dominated by the workbook's two-decimal weights, not by how finely the
 * basket is split), but only the classes let someone drop tobacco while
 * keeping alcohol.
 */
const LEAF_LEVEL = 'expenditure class';

/**
 * Everything the /basket page needs, for every city at once.
 *
 * All nine locations are fetched together — 87 classes x 19 months x 9 cities
 * is a few hundred kilobytes — so that switching city is instant and does not
 * throw away the selection the way a server round trip would.
 */
export async function getBasketInputs(): Promise<BasketInputs> {
  // The newest pattern loaded. Its link period is the ABS-valid start for
  // aggregation; class indexes themselves run further back, so a "today's mix
  // through history" reading can start at the earliest month every class has.
  const patternResult = await query<{ pattern: number; link_period: string }>(
    `SELECT pattern, TO_CHAR(link_period, 'YYYY-MM') AS link_period
       FROM auscpi.cpi_weights_by_city
      GROUP BY pattern, link_period
      ORDER BY pattern DESC
      LIMIT 1`
  );

  const pattern = patternResult.rows[0];
  if (!pattern) {
    throw new Error('No weighting pattern loaded in auscpi.cpi_weights_by_city');
  }

  // Latest of the per-class start dates: before that, at least one expenditure
  // class is missing and the arrays would not line up.
  const startResult = await query<{ start_month: string }>(
    `SELECT TO_CHAR(MAX(first_date), 'YYYY-MM') AS start_month
       FROM (
         SELECT MIN(i.publish_date) AS first_date
           FROM auscpi.cpi_index_monthly i
           JOIN (
             SELECT DISTINCT item
               FROM auscpi.cpi_weights_by_city
              WHERE pattern = $1 AND item_level = $2
           ) c ON c.item = i.item
          WHERE i.city = 'Australia'
          GROUP BY i.item
       ) starts`,
    [pattern.pattern, LEAF_LEVEL]
  );
  const startMonth = startResult.rows[0]?.start_month ?? pattern.link_period;

  // weight is numeric and cpi_value is numeric, both of which node-postgres
  // hands back as strings to protect precision it cannot represent. Two
  // decimal places of an index near 100 is nowhere near that limit, so cast
  // in SQL and let the driver return numbers.
  const [weightsResult, seriesResult, headlineResult, monthsResult] = await Promise.all([
    query<WeightRow>(
      `SELECT item, city, item_level, parent_item, weight::float8 AS weight
         FROM auscpi.cpi_weights_by_city
        WHERE pattern = $1
        ORDER BY city, item`,
      [pattern.pattern]
    ),

    // Joined on the distinct class names rather than on the weights table
    // itself: eight labels are published both as a sub-group and as an
    // expenditure class, and joining every weight row would return each of
    // their series twice.
    query<{ city: string; item: string; values: number[] }>(
      `SELECT i.city, i.item,
              array_agg(i.cpi_value::float8 ORDER BY i.publish_date) AS values
         FROM auscpi.cpi_index_monthly i
         JOIN (SELECT DISTINCT item
                 FROM auscpi.cpi_weights_by_city
                WHERE pattern = $1 AND item_level = $2) c ON c.item = i.item
        WHERE i.publish_date >= TO_DATE($3, 'YYYY-MM')
        GROUP BY i.city, i.item`,
      [pattern.pattern, LEAF_LEVEL, startMonth]
    ),

    query<{ city: string; values: number[] }>(
      `SELECT city, array_agg(cpi_value::float8 ORDER BY publish_date) AS values
         FROM auscpi.cpi_index_monthly
        WHERE item = $1 AND publish_date >= TO_DATE($2, 'YYYY-MM')
        GROUP BY city`,
      [HEADLINE_ITEM, startMonth]
    ),

    query<{ month: string }>(
      `SELECT DISTINCT TO_CHAR(publish_date, 'YYYY-MM') AS month
         FROM auscpi.cpi_index_monthly
        WHERE publish_date >= TO_DATE($1, 'YYYY-MM')
        ORDER BY month`,
      [startMonth]
    ),
  ]);

  const weights: Record<string, Record<string, number>> = {};
  for (const row of weightsResult.rows) {
    // Keyed on item alone, so a label published at two levels would collide.
    // The two rows carry the same weight where that happens (a sub-group with
    // a single child of its own name is that child), so either value is right.
    (weights[row.city] ??= {})[row.item] = row.weight;
  }

  const series: Record<string, Record<string, number[]>> = {};
  for (const row of seriesResult.rows) {
    (series[row.city] ??= {})[row.item] = row.values;
  }

  const headline: Record<string, number[]> = {};
  for (const row of headlineResult.rows) {
    headline[row.city] = row.values;
  }

  return {
    pattern: pattern.pattern,
    linkPeriod: pattern.link_period,
    months: monthsResult.rows.map((row) => row.month),
    // Ordered with the national weighted average first, then the eight
    // capitals alphabetically, matching how the rest of the site lists them.
    cities: Object.keys(headline).sort((a, b) =>
      a === 'Australia' ? -1 : b === 'Australia' ? 1 : a.localeCompare(b)
    ),
    tree: buildTree(weightsResult.rows),
    weights,
    series,
    headline,
  };
}
