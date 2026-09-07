/**
 * GET /api/bls/crosswalk?item=...
 * Best ABS→BLS crosswalk row (exact/close) with has_data flag, or null.
 */

import { NextRequest } from 'next/server';
import { getCrosswalkWithDataForAbsItem } from '@/lib/queries';
import { absItemSchema } from '@/lib/validations';
import {
  successResponse,
  handleValidationError,
  handleDatabaseError,
} from '@/lib/api-utils';
import type { CrosswalkWithData } from '@/lib/queries/bls';

export async function GET(request: NextRequest) {
  try {
    const item = request.nextUrl.searchParams.get('item') ?? '';

    const validation = absItemSchema.safeParse(item);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const data = await getCrosswalkWithDataForAbsItem(validation.data);

    return successResponse<CrosswalkWithData | null>(data);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
