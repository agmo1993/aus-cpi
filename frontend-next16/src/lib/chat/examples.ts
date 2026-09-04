/**
 * Documentation fixtures: example user questions → tool calls → expected UI parts.
 * Not executed as tests.
 */

import type { AnswerPart } from './schema';
import type { ChatToolName } from './tools';

export interface ChatExample {
  id: string;
  question: string;
  toolCalls: Array<{ name: ChatToolName; args: Record<string, unknown> }>;
  expectedPartTypes: AnswerPart['type'][];
  notes?: string;
}

export const CHAT_EXAMPLES: ChatExample[] = [
  {
    id: 'headline',
    question: 'What is the latest headline CPI?',
    toolCalls: [{ name: 'get_headline_cpi', args: {} }],
    expectedPartTypes: ['stat_cards', 'timeseries'],
    notes: 'MoM / QoQ / YoY match home page arithmetic on All groups CPI, Australia.',
  },
  {
    id: 'search-then-series',
    question: 'Show me electricity prices in Sydney over the last two years',
    toolCalls: [
      {
        name: 'search_cpi_series',
        args: { query: 'Electricity', frequency: 'Monthly', limit: 10 },
      },
      {
        name: 'resolve_series',
        args: { item: 'Electricity', city: 'Sydney', frequency: 'Monthly' },
      },
      {
        name: 'get_cpi_timeseries',
        args: {
          seriesid: '<resolved>',
          frequency: 'monthly',
          from: '09-2024',
          to: '08-2026',
        },
      },
    ],
    expectedPartTypes: ['series_list', 'timeseries'],
  },
  {
    id: 'top-movers',
    question: 'Which categories rose the most this month?',
    toolCalls: [
      { name: 'get_top_movers', args: { period: 'monthly', limit: 5 } },
    ],
    expectedPartTypes: ['top_movers'],
  },
  {
    id: 'annual-groups',
    question: 'How much have housing and food risen over the year?',
    toolCalls: [
      {
        name: 'get_annual_change',
        args: {
          items: ['Housing', 'Food and non-alcoholic beverages'],
          city: 'Australia',
        },
      },
    ],
    expectedPartTypes: ['stat_cards'],
  },
  {
    id: 'correlate',
    question: 'How correlated are rent and electricity nationally?',
    toolCalls: [
      {
        name: 'resolve_series',
        args: { item: 'Rents', city: 'Australia' },
      },
      {
        name: 'resolve_series',
        args: { item: 'Electricity', city: 'Australia' },
      },
      {
        name: 'correlate_series',
        args: {
          seriesids: ['<rents-id>', '<electricity-id>'],
          frequency: 'monthly',
        },
      },
    ],
    expectedPartTypes: ['series_list', 'correlation_matrix'],
    notes: 'Pearson path matches /api/correlate; MIN_OVERLAP is 12 shared months.',
  },
];
