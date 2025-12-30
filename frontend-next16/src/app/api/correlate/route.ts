/**
 * POST /api/correlate
 * Calculate Pearson correlation between multiple CPI time series
 */

import { NextRequest } from 'next/server';
import calculateCorrelation from 'calculate-correlation';
import { correlateRequestSchema } from '@/lib/validations';
import {
  successResponse,
  errorResponse,
  handleValidationError,
} from '@/lib/api-utils';
import type { CorrelateRequest, CorrelateResponse, CorrelationArrayItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = correlateRequestSchema.safeParse(body);

    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const postData: CorrelateRequest = validation.data;

    // Transform data into correlation calculation format
    const arrays: CorrelationArrayItem[] = postData.map((series) => ({
      item: series[0].item,
      values: series.map((point) => parseFloat(point.cpi_value)),
    }));

    const categories = postData.map((series) => series[0].item);
    const n = arrays.length;

    // Calculate pairwise correlations
    const correlationData = [];
    const processed = new Set<string>(); // Track processed pairs

    for (let i = 0; i < n; i++) {
      const value1 = arrays[i];
      for (let j = 0; j < n; j++) {
        const value2 = arrays[j];

        // Skip self-correlation and already processed pairs
        if (value1.item === value2.item) continue;

        const pairKey = `${value2.item}|${value1.item}`;
        if (processed.has(pairKey)) continue;

        // Validate arrays have same length
        if (value1.values.length !== value2.values.length) {
          return errorResponse(
            'All time series must have the same length for correlation',
            400
          );
        }

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
              `Invalid correlation between ${value1.item} and ${value2.item}`
            );
            continue;
          }

          correlationData.push({
            itemY: value1.item,
            itemX: value2.item,
            corr,
          });

          processed.add(`${value1.item}|${value2.item}`);
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
