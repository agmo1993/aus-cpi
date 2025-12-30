/**
 * GET /api/lookupMonthly
 * Fetch all monthly CPI categories/series for selection
 */

import { NextRequest } from 'next/server';
import { getMonthlyCategories } from '@/lib/queries';
import { successResponse, handleDatabaseError } from '@/lib/api-utils';
import type { LookupMonthlyResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Fetch all monthly categories from lookup table
    const categories = await getMonthlyCategories();

    return successResponse<LookupMonthlyResponse>(categories);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
