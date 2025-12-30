/**
 * GET /api/timeseriesqtl/[seriesid]
 * Fetch quarterly CPI time series data for a specific series
 */

import { NextRequest } from 'next/server';
import { getQuarterlyTimeSeries } from '@/lib/queries';
import { seriesIdSchema } from '@/lib/validations';
import {
  successResponse,
  handleValidationError,
  handleDatabaseError,
} from '@/lib/api-utils';
import type { TimeSeriesQuarterlyResponse } from '@/types';

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
    const data = await getQuarterlyTimeSeries(validation.data);

    // Return typed response
    return successResponse<TimeSeriesQuarterlyResponse>(data);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
