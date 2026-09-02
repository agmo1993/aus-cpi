/**
 * GET /api/gva/[seriesid]
 * Quarterly industry GVA, shaped like a CPI time series so the line chart
 * can plot it on the same axis after the client rebases.
 */

import { NextRequest } from 'next/server';
import { getGvaTimeSeries } from '@/lib/queries/gva';
import { seriesIdSchema } from '@/lib/validations';
import {
  successResponse,
  handleValidationError,
  handleDatabaseError,
} from '@/lib/api-utils';
import type { TimeSeriesResponse } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ seriesid: string }> }
) {
  try {
    const { seriesid } = await params;
    const validation = seriesIdSchema.safeParse(seriesid);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }
    const data = await getGvaTimeSeries(validation.data);
    return successResponse<TimeSeriesResponse>(data);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
