/**
 * Chat tool and Answer schemas.
 * Pure Zod + types — safe to import from client or server.
 */

import { z } from 'zod';

/** ABS publish_date keys as returned by the query layer. */
export const monthKeySchema = z
  .string()
  .regex(/^\d{2}-\d{4}$/, 'Month must be mm-yyyy');

export const frequencySchema = z.enum(['monthly', 'quarterly']);
export const topMoverPeriodSchema = z.enum(['monthly', 'yearly']);
export const statsModeSchema = z.enum(['statistics', 'percentage_changes', 'both']);
export const pctPeriodSchema = z.enum(['monthly', 'quarterly', 'yearly']);

// --- Tool argument schemas -------------------------------------------------

export const searchCpiSeriesArgsSchema = z.object({
  query: z.string().min(1, 'Search term is required'),
  frequency: z.enum(['Monthly', 'Quarterly']).optional(),
  limit: z.number().int().positive().max(50).default(10),
});

export const resolveSeriesArgsSchema = z
  .object({
    seriesid: z.string().min(1).optional(),
    item: z.string().min(1).optional(),
    city: z.string().min(1).default('Australia'),
    frequency: z.enum(['Monthly', 'Quarterly']).optional(),
  })
  .refine((v) => Boolean(v.seriesid) || Boolean(v.item), {
    message: 'Provide seriesid, or item (with optional city)',
  });

export const getCpiTimeseriesArgsSchema = z.object({
  seriesid: z.string().min(1),
  frequency: frequencySchema.default('monthly'),
  from: monthKeySchema.optional(),
  to: monthKeySchema.optional(),
});

export const getHeadlineCpiArgsSchema = z.object({}).default({});

export const getTopMoversArgsSchema = z.object({
  period: topMoverPeriodSchema.default('monthly'),
  limit: z.number().int().positive().max(20).default(5),
  /** Cap sparkline points returned in UI (query layer already limits). */
  sparklinePoints: z.number().int().positive().max(60).default(24),
});

export const getAnnualChangeArgsSchema = z.object({
  items: z.array(z.string().min(1)).min(1).max(20),
  city: z.string().min(1).default('Australia'),
});

export const getSeriesStatsArgsSchema = z.object({
  seriesid: z.string().min(1),
  mode: statsModeSchema.default('statistics'),
  frequency: frequencySchema.default('monthly'),
  /** Used when mode includes percentage_changes. */
  pctPeriod: pctPeriodSchema.default('yearly'),
});

export const correlateSeriesArgsSchema = z.object({
  seriesids: z.array(z.string().min(1)).min(2).max(12),
  frequency: frequencySchema.default('monthly'),
});

// --- Generative UI Answer parts --------------------------------------------

export const trendDirectionSchema = z.enum(['up', 'down', 'neutral']);

export const statCardSchema = z.object({
  title: z.string(),
  value: z.union([z.string(), z.number()]),
  trend: z
    .object({
      value: z.string(),
      label: z.string(),
      direction: trendDirectionSchema,
    })
    .optional(),
});

export const timeseriesPointSchema = z.object({
  date: z.string(), // mm-yyyy
  value: z.number(),
});

export const timeseriesSeriesSchema = z.object({
  label: z.string(),
  seriesid: z.string().optional(),
  points: z.array(timeseriesPointSchema),
});

export const topMoverRowSchema = z.object({
  item: z.string(),
  city: z.string(),
  seriesid: z.string(),
  pct_change: z.string(),
  current_value: z.string(),
  sparkline: z
    .array(
      z.object({
        publish_date: z.string(),
        cpi_value: z.string(),
      })
    )
    .optional(),
});

export const seriesListItemSchema = z.object({
  seriesid: z.string(),
  item: z.string(),
  city: z.string(),
  data_frequency: z.string().optional(),
  label: z.string(), // `${city} - ${item}`
});

export const correlationPairSchema = z.object({
  indexY: z.number().int(),
  indexX: z.number().int(),
  itemY: z.string(),
  itemX: z.string(),
  corr: z.number(),
});

export const answerPartSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stat_cards'),
    cards: z.array(statCardSchema),
  }),
  z.object({
    type: z.literal('timeseries'),
    series: z.array(timeseriesSeriesSchema),
  }),
  z.object({
    type: z.literal('top_movers'),
    period: topMoverPeriodSchema,
    rows: z.array(topMoverRowSchema),
  }),
  z.object({
    type: z.literal('correlation_matrix'),
    labels: z.array(z.string()),
    pairs: z.array(correlationPairSchema),
    overlapMonths: z.number().int().optional(),
  }),
  z.object({
    type: z.literal('series_list'),
    items: z.array(seriesListItemSchema),
  }),
  z.object({
    type: z.literal('text'),
    markdown: z.string(),
  }),
]);

export const answerSchema = z.object({
  prose: z.string().optional(),
  parts: z.array(answerPartSchema),
  asOfMonth: monthKeySchema.optional(),
});

/** Tool handler envelope: raw data for the model + suggested UI parts. */
export const toolResultSchema = z.object({
  data: z.unknown(),
  ui: z.array(answerPartSchema),
  asOfMonth: monthKeySchema.optional(),
  error: z.string().optional(),
});

// --- Inferred types --------------------------------------------------------

export type SearchCpiSeriesArgs = z.infer<typeof searchCpiSeriesArgsSchema>;
export type ResolveSeriesArgs = z.infer<typeof resolveSeriesArgsSchema>;
export type GetCpiTimeseriesArgs = z.infer<typeof getCpiTimeseriesArgsSchema>;
export type GetHeadlineCpiArgs = z.infer<typeof getHeadlineCpiArgsSchema>;
export type GetTopMoversArgs = z.infer<typeof getTopMoversArgsSchema>;
export type GetAnnualChangeArgs = z.infer<typeof getAnnualChangeArgsSchema>;
export type GetSeriesStatsArgs = z.infer<typeof getSeriesStatsArgsSchema>;
export type CorrelateSeriesArgs = z.infer<typeof correlateSeriesArgsSchema>;

export type StatCard = z.infer<typeof statCardSchema>;
export type AnswerPart = z.infer<typeof answerPartSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type ToolResult = z.infer<typeof toolResultSchema>;
export type SeriesListItem = z.infer<typeof seriesListItemSchema>;
