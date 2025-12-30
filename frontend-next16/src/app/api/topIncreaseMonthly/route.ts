/**
 * GET /api/topIncreaseMonthly
 * Fetch top 5 monthly CPI price increases
 */

import { NextRequest } from 'next/server';
import { getTopMonthlyIncreases } from '@/lib/queries';
import { successResponse, handleDatabaseError } from '@/lib/api-utils';
import type { TopIncreaseMonthlyResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Get limit from query params (default: 5)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Validate limit
    const validLimit = Math.min(Math.max(limit, 1), 100);

    // Fetch top monthly increases
    const topMovers = await getTopMonthlyIncreases(validLimit);

    const response: TopIncreaseMonthlyResponse = {
      topMovers,
    };

    return successResponse<TopIncreaseMonthlyResponse>(response);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
