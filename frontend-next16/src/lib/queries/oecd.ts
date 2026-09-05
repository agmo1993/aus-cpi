/**
 * OECD CPI queries
 * Monthly headline CPI from OECD SDMX (YoY % and index), separate from ABS.
 */

import { query } from '../db';

export interface OecdCountry {
  country_code: string;
  country_name: string;
}

export interface OecdLatestYoy {
  country_code: string;
  country_name: string;
  /** mm-yyyy */
  period: string;
  value: number;
}

export interface OecdYoyPoint {
  /** mm-yyyy */
  date: string;
  value: number;
}

export interface OecdYoySeries {
  country_code: string;
  country_name: string;
  points: OecdYoyPoint[];
}

const YOY_FILTER = `unit_measure = 'PA' AND transform = 'GY'`;

/**
 * Distinct countries ordered by name.
 * Prefers rows that have a YoY (PA/GY) series.
 */
export async function listOecdCountries(): Promise<OecdCountry[]> {
  const result = await query<OecdCountry>(
    `SELECT country_code,
            COALESCE(MAX(country_name), country_code) AS country_name
     FROM auscpi.oecd_cpi
     WHERE ${YOY_FILTER}
     GROUP BY country_code
     ORDER BY country_name ASC`
  );
  return result.rows;
}

/**
 * Latest YoY observation per country (PA/GY).
 * Optional countryCodes filters the set.
 */
export async function getOecdLatestYoy(
  countryCodes?: string[]
): Promise<OecdLatestYoy[]> {
  const params: unknown[] = [];
  let codeFilter = '';
  if (countryCodes && countryCodes.length > 0) {
    params.push(countryCodes);
    codeFilter = ' AND t.country_code = ANY($1::text[])';
  }

  const result = await query<{
    country_code: string;
    country_name: string;
    period: string;
    value: string;
  }>(
    // Order by table period (date), not the mm-yyyy output alias — Postgres
    // resolves ORDER BY aliases first, which would sort text keys wrong.
    `SELECT DISTINCT ON (t.country_code)
       t.country_code,
       COALESCE(t.country_name, t.country_code) AS country_name,
       TO_CHAR(t.period, 'mm-yyyy') AS period,
       t.value::text AS value
     FROM auscpi.oecd_cpi t
     WHERE t.unit_measure = 'PA' AND t.transform = 'GY'${codeFilter}
     ORDER BY t.country_code, t.period DESC`,
    params
  );

  return result.rows
    .map((row) => ({
      country_code: row.country_code,
      country_name: row.country_name,
      period: row.period,
      value: parseFloat(row.value),
    }))
    .sort((a, b) => a.country_name.localeCompare(b.country_name));
}

export async function getOecdYoyTimeseries(
  countryCodes: string[]
): Promise<OecdYoySeries[]> {
  if (!countryCodes.length) return [];

  const result = await query<{
    country_code: string;
    country_name: string;
    date: string;
    value: string;
  }>(
    `SELECT
       country_code,
       COALESCE(country_name, country_code) AS country_name,
       TO_CHAR(period, 'mm-yyyy') AS date,
       value::text AS value
     FROM auscpi.oecd_cpi
     WHERE ${YOY_FILTER}
       AND country_code = ANY($1::text[])
     ORDER BY country_code, period ASC`,
    [countryCodes]
  );

  const byCode = new Map<string, OecdYoySeries>();
  for (const row of result.rows) {
    let series = byCode.get(row.country_code);
    if (!series) {
      series = {
        country_code: row.country_code,
        country_name: row.country_name,
        points: [],
      };
      byCode.set(row.country_code, series);
    }
    const n = parseFloat(row.value);
    if (Number.isFinite(n)) {
      series.points.push({ date: row.date, value: n });
    }
  }

  // Preserve request order
  const ordered: OecdYoySeries[] = [];
  for (const code of countryCodes) {
    const s = byCode.get(code);
    if (s) ordered.push(s);
  }
  return ordered;
}
