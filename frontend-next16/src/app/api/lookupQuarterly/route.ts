/**
 * GET /api/lookupQuarterly
 * Fetch all quarterly CPI categories/series for selection
 */

import { NextRequest } from 'next/server';
import { getQuarterlyCategories } from '@/lib/queries';
import { successResponse, handleDatabaseError } from '@/lib/api-utils';
import type { LookupQuarterlyResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Fetch all quarterly categories from lookup table
    const categories = await getQuarterlyCategories();

    return successResponse<LookupQuarterlyResponse>(categories);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
