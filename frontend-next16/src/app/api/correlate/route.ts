/**
 * POST /api/correlate
 * Calculate Pearson correlation between multiple CPI time series
 */

import { NextRequest } from 'next/server';
import calculateCorrelation from 'calculate-correlation';
import { correlateRequestSchema } from '@/lib/validations';
import { alignOnIntersection, type SeriesRow } from '@/lib/timeseries';
import {
  successResponse,
  errorResponse,
  handleValidationError,
} from '@/lib/api-utils';
import type { CorrelateRequest, CorrelateResponse, CorrelationArrayItem } from '@/types';

/**
 * Fewest shared months worth correlating. Pearson's r is defined from two
 * points and meaningless there; a year of overlap is the smallest span that
 * says anything about series this seasonal.
 */
const MIN_OVERLAP = 12;

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = correlateRequestSchema.safeParse(body);

    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const postData: CorrelateRequest = validation.data;

    // Series start on different dates, so correlate the months they share
    // rather than matching them up by array position, which would compare
    // unrelated periods whenever the start dates differ.
    const { months, values } = alignOnIntersection(
      postData as unknown as SeriesRow[][],
      'publish_date',
      'cpi_value'
    );

    if (months.length < MIN_OVERLAP) {
      return errorResponse(
        `The selected series overlap for only ${months.length} month(s); ` +
          `at least ${MIN_OVERLAP} are needed to correlate them`,
        400
      );
    }

    const arrays: CorrelationArrayItem[] = postData.map((series, index) => ({
      item: series[0].item,
      values: values[index],
    }));

    const categories = postData.map((series) => series[0].item);
    const n = arrays.length;

    // Pair by position, not by item name.
    //
    // An item name is not unique: the same item is published for all nine
    // locations, so selecting 'Accessories' for Adelaide, Hobart and Perth
    // gives three series that share one name. Skipping pairs whose names match
    // treated those as self-correlations and returned an empty result for a
    // perfectly reasonable comparison. Indices are unique by construction, and
    // j > i already visits each unordered pair exactly once.
    const correlationData = [];

    for (let i = 0; i < n; i++) {
      const value1 = arrays[i];
      for (let j = i + 1; j < n; j++) {
        const value2 = arrays[j];

        // Check for valid numeric values
        if (
          value1.values.some((v) => isNaN(v)) ||
          value2.values.some((v) => isNaN(v))
        ) {
          return errorResponse(
            'All CPI values must be valid numbers',
            400
          );
        }

        try {
          const corr = calculateCorrelation(value1.values, value2.values);

          // Check for valid correlation result
          if (isNaN(corr)) {
            console.warn(
              `Invalid correlation between series ${i} and ${j}`
            );
            continue;
          }

          // Indices travel with the pair so the client can label each series
          // with its city as well as its item, which names alone cannot do.
          correlationData.push({
            indexY: i,
            indexX: j,
            itemY: value1.item,
            itemX: value2.item,
            corr,
          });
        } catch (error) {
          console.error('Correlation calculation error:', error);
          return errorResponse(
            'Error calculating correlation coefficients',
            500
          );
        }
      }
    }

    const response: CorrelateResponse = {
      data: correlationData,
      categories,
    };

    return successResponse<CorrelateResponse>(response);
  } catch (error) {
    console.error('Correlate API error:', error);
    return errorResponse('Invalid request format', 400);
  }
}
