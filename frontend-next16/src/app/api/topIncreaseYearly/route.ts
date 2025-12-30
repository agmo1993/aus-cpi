/**
 * GET /api/topIncreaseYearly
 * Fetch top 5 yearly CPI price increases
 */

import { NextRequest } from 'next/server';
import { getTopYearlyIncreases } from '@/lib/queries';
import { successResponse, handleDatabaseError } from '@/lib/api-utils';
import type { TopIncreaseYearlyResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Get limit from query params (default: 5)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Validate limit
    const validLimit = Math.min(Math.max(limit, 1), 100);

    // Fetch top yearly increases
    const topMovers = await getTopYearlyIncreases(validLimit);

    const response: TopIncreaseYearlyResponse = {
      topMovers,
    };

    return successResponse<TopIncreaseYearlyResponse>(response);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
