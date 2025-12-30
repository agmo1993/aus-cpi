/**
 * GET /api/timeseries/[seriesid]
 * Fetch monthly CPI time series data for a specific series
 */

import { NextRequest } from 'next/server';
import { getMonthlyTimeSeries } from '@/lib/queries';
import { seriesIdSchema } from '@/lib/validations';
import {
  successResponse,
  errorResponse,
  handleValidationError,
  handleDatabaseError,
} from '@/lib/api-utils';
import type { TimeSeriesResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seriesid: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { seriesid } = await params;

    // Validate series ID
    const validation = seriesIdSchema.safeParse(seriesid);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    // Fetch data from database using typed query
    const data = await getMonthlyTimeSeries(validation.data);

    // Return typed response
    return successResponse<TimeSeriesResponse>(data);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
