/**
 * GET /api/monthlyCPI
 * Fetch main CPI index series for home page
 * Series: A128478317T (All groups CPI, Australia)
 */

import { NextRequest } from 'next/server';
import { getMainCPISeries } from '@/lib/queries';
import { successResponse, handleDatabaseError } from '@/lib/api-utils';
import type { MonthlyCPIResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    // Fetch main CPI series data
    const data = await getMainCPISeries();

    // Format response to match original API structure
    const response: MonthlyCPIResponse = {
      'All groups CPI, Australia': data,
    };

    return successResponse<MonthlyCPIResponse>(response);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
