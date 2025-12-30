/**
 * API Utility Functions
 * Helper functions for API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Create a success JSON response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  error?: any
) {
  console.error('API Error:', { message, status, error });

  return NextResponse.json(
    {
      error: message,
      statusCode: status,
    },
    { status }
  );
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError<any>) {
  const firstError = error.issues[0];
  return errorResponse(
    `Validation error: ${firstError.message}`,
    400,
    error
  );
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: any) {
  // Don't expose internal database errors to client
  return errorResponse(
    'An error occurred while fetching data from the database',
    500,
    error
  );
}

/**
 * Handle not found errors
 */
export function notFoundResponse(resource: string = 'Resource') {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Validate and parse request params with Zod schema
 */
export async function validateParams<T>(
  schema: any,
  params: any
): Promise<{ success: true; data: T } | { success: false; error: ZodError }> {
  try {
    const data = await schema.parseAsync(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Validate and parse request body with Zod schema
 */
export async function validateBody<T>(
  request: Request,
  schema: any
): Promise<{ success: true; data: T } | { success: false; error: ZodError }> {
  try {
    const body = await request.json();
    const data = await schema.parseAsync(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}
