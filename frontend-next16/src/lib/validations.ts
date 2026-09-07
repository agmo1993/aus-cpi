/**
 * Request Validation Schemas
 * Zod schemas for API request validation
 */

import { z } from 'zod';

/**
 * Series ID validation
 * Only alphanumeric characters allowed
 */
export const seriesIdSchema = z
  .string()
  .min(1, 'Series ID is required')
  .regex(/^[A-Za-z0-9]+$/, 'Series ID must contain only letters and numbers');

/**
 * Correlation request validation
 * Array of arrays of time series data points
 */
export const correlateRequestSchema = z.array(
  z.array(
    z.object({
      publish_date: z.string(),
      cpi_value: z.string(),
      item: z.string(),
    })
  )
).min(2, 'At least 2 series required for correlation');

/**
 * Date string validation (mm-yyyy format)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{2}-\d{4}$/, 'Date must be in mm-yyyy format');

/**
 * Limit parameter validation
 */
export const limitSchema = z
  .number()
  .int()
  .positive()
  .max(100, 'Limit cannot exceed 100')
  .default(5);

/**
 * BLS CU item_code validation (e.g. SA0, SAF1, SA0E, SEHF01)
 */
export const blsItemCodeSchema = z
  .string()
  .min(1, 'BLS item code is required')
  .regex(/^[A-Za-z0-9]+$/, 'BLS item code must contain only letters and numbers');

/**
 * ABS item name for crosswalk lookup
 */
export const absItemSchema = z
  .string()
  .min(1, 'ABS item is required')
  .max(200, 'ABS item name is too long');
