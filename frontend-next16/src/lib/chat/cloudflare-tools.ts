/**
 * Convert CHAT_TOOLS into Cloudflare Workers AI tool objects.
 * Hand-written JSON Schema matching schema.ts (no zod-to-json-schema).
 * Workers AI (glm / OpenAI-compatible) requires:
 *   { type: 'function', function: { name, description, parameters } }
 */

import { CHAT_TOOLS, type ChatToolName } from './tools';

export interface CloudflareToolParameterSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

/** OpenAI-style tool object required by Workers AI free-tier models (e.g. glm-4.7-flash). */
export interface CloudflareToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: CloudflareToolParameterSchema;
  };
}

const MONTH_KEY = {
  type: 'string',
  pattern: '^\\d{2}-\\d{4}$',
  description: 'Month key as mm-yyyy',
} as const;

/** Per-tool JSON Schema for Workers AI function calling. */
const TOOL_PARAMETER_SCHEMAS: Record<ChatToolName, CloudflareToolParameterSchema> = {
  search_cpi_series: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        minLength: 1,
        description: 'Search term for ABS CPI item names',
      },
      frequency: {
        type: 'string',
        enum: ['monthly', 'quarterly', 'Monthly', 'Quarterly'],
        description: 'Frequency (any casing; also accepts Monthly/Quarterly)',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 10,
        description: 'Max results (default 10)',
      },
    },
    required: ['query'],
  },
  resolve_series: {
    type: 'object',
    properties: {
      seriesid: {
        type: 'string',
        minLength: 1,
        description: 'ABS series id if known',
      },
      item: {
        type: 'string',
        minLength: 1,
        description: 'ABS item name if seriesid unknown',
      },
      city: {
        type: 'string',
        minLength: 1,
        default: 'Australia',
        description: 'City or Australia (default Australia)',
      },
      frequency: {
        type: 'string',
        enum: ['monthly', 'quarterly', 'Monthly', 'Quarterly'],
        description: 'Frequency (any casing; also accepts Monthly/Quarterly)',
      },
    },
    required: [],
  },
  get_cpi_timeseries: {
    type: 'object',
    properties: {
      seriesid: {
        type: 'string',
        minLength: 1,
        description: 'ABS series id',
      },
      frequency: {
        type: 'string',
        enum: ['monthly', 'quarterly', 'Monthly', 'Quarterly'],
        default: 'monthly',
        description: 'Frequency (any casing; also accepts Monthly/Quarterly)',
      },
      from: MONTH_KEY,
      to: MONTH_KEY,
    },
    required: ['seriesid'],
  },
  get_headline_cpi: {
    type: 'object',
    properties: {},
    required: [],
  },
  get_top_movers: {
    type: 'object',
    properties: {
      period: {
        type: 'string',
        enum: ['monthly', 'yearly'],
        default: 'monthly',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 20,
        default: 5,
      },
      sparklinePoints: {
        type: 'integer',
        minimum: 1,
        maximum: 60,
        default: 24,
      },
    },
    required: [],
  },
  get_annual_change: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { type: 'string', minLength: 1 },
        minItems: 1,
        maxItems: 20,
        description: 'ABS item names',
      },
      city: {
        type: 'string',
        minLength: 1,
        default: 'Australia',
      },
    },
    required: ['items'],
  },
  get_series_stats: {
    type: 'object',
    properties: {
      seriesid: {
        type: 'string',
        minLength: 1,
      },
      mode: {
        type: 'string',
        enum: ['statistics', 'percentage_changes', 'both'],
        default: 'statistics',
      },
      frequency: {
        type: 'string',
        enum: ['monthly', 'quarterly', 'Monthly', 'Quarterly'],
        default: 'monthly',
        description: 'Frequency (any casing; also accepts Monthly/Quarterly)',
      },
      pctPeriod: {
        type: 'string',
        enum: ['monthly', 'quarterly', 'yearly'],
        default: 'yearly',
        description: 'Used when mode includes percentage_changes',
      },
    },
    required: ['seriesid'],
  },
  correlate_series: {
    type: 'object',
    properties: {
      seriesids: {
        type: 'array',
        items: { type: 'string', minLength: 1 },
        minItems: 2,
        maxItems: 12,
      },
      frequency: {
        type: 'string',
        enum: ['monthly', 'quarterly', 'Monthly', 'Quarterly'],
        default: 'monthly',
        description: 'Frequency (any casing; also accepts Monthly/Quarterly)',
      },
    },
    required: ['seriesids'],
  },
  compare_item_across_cities: {
    type: 'object',
    properties: {
      item: {
        type: 'string',
        minLength: 1,
        description: 'Canonical ABS CPI item name (e.g. Food and non-alcoholic beverages)',
      },
      frequency: {
        type: 'string',
        enum: ['monthly', 'quarterly', 'Monthly', 'Quarterly'],
        default: 'monthly',
        description: 'Frequency (any casing; also accepts Monthly/Quarterly)',
      },
      cities: {
        type: 'array',
        items: { type: 'string', minLength: 1 },
        minItems: 1,
        maxItems: 12,
        description:
          'Optional city filter. Defaults to all capital cities plus Australia when present in lookup.',
      },
    },
    required: ['item'],
  },
};

export function toCloudflareTools(): CloudflareToolDef[] {
  return (Object.keys(CHAT_TOOLS) as ChatToolName[]).map((name) => {
    const def = CHAT_TOOLS[name];
    return {
      type: 'function' as const,
      function: {
        name: def.name,
        description: def.description,
        parameters: TOOL_PARAMETER_SCHEMAS[name],
      },
    };
  });
}
