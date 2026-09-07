/**
 * GET /api/bls/timeseries/[itemCode]
 * Fetch BLS CPI-U time series for a CU item_code (e.g. SA0, SAF1)
 */

import { NextRequest } from 'next/server';
import { getBlsTimeSeriesByItemCode } from '@/lib/queries';
import { blsItemCodeSchema } from '@/lib/validations';
import {
  successResponse,
  handleValidationError,
  handleDatabaseError,
  notFoundResponse,
} from '@/lib/api-utils';
import type { TimeSeriesResponse } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemCode: string }> }
) {
  try {
    const { itemCode } = await params;

    const validation = blsItemCodeSchema.safeParse(itemCode);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const data = await getBlsTimeSeriesByItemCode(validation.data);

    if (data.length === 0) {
      return notFoundResponse('BLS time series');
    }

    return successResponse<TimeSeriesResponse>(data);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
