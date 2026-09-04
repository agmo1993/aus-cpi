/**
 * AusCPI chat data tools — public surface.
 *
 * Handlers hit Postgres; import this module only from server code
 * (Route Handlers, Server Actions, RSC). Schema types alone can be
 * re-exported to the client via `./schema` if needed.
 */

import { CHAT_TOOLS, type ChatToolName } from './tools';
import { chatHandlers } from './handlers';
import type { Answer, AnswerPart, ToolResult } from './schema';

export { CHAT_TOOLS, CHAT_TOOL_NAMES, type ChatToolName, type ChatToolDef, type UiComponentName } from './tools';
export { chatHandlers } from './handlers';
export {
  answerSchema,
  answerPartSchema,
  toolResultSchema,
  searchCpiSeriesArgsSchema,
  resolveSeriesArgsSchema,
  getCpiTimeseriesArgsSchema,
  getHeadlineCpiArgsSchema,
  getTopMoversArgsSchema,
  getAnnualChangeArgsSchema,
  getSeriesStatsArgsSchema,
  correlateSeriesArgsSchema,
  type Answer,
  type AnswerPart,
  type ToolResult,
  type StatCard,
  type SeriesListItem,
} from './schema';

/**
 * Validate args against the tool catalog and run the matching handler.
 * Returns a ToolResult with raw `data` (for a future model) and suggested `ui` parts.
 */
export async function runChatTool(
  name: string,
  args: unknown
): Promise<ToolResult> {
  if (!(name in CHAT_TOOLS)) {
    return {
      data: null,
      ui: [{ type: 'text', markdown: `Unknown tool: \`${name}\`.` }],
      error: `Unknown tool: ${name}`,
    };
  }

  const toolName = name as ChatToolName;
  const def = CHAT_TOOLS[toolName];
  const parsed = def.argsSchema.safeParse(args ?? {});

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    return {
      data: { issues: parsed.error.issues },
      ui: [{ type: 'text', markdown: `Invalid arguments for \`${name}\`: ${message}` }],
      error: message,
    };
  }

  return chatHandlers[toolName](parsed.data);
}

/** Convenience: build an Answer envelope from tool UI parts. */
export function answerFromToolResult(
  result: ToolResult,
  prose?: string
): Answer {
  return {
    prose,
    parts: result.ui as AnswerPart[],
    asOfMonth: result.asOfMonth,
  };
}
