/**
 * POST /api/chat
 * Cloudflare Workers AI picks tools; Postgres handlers via runChatTool supply numbers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  runChatTool,
  type AnswerPart,
} from '@/lib/chat';
import {
  runWorkersAiChat,
  WorkersAiError,
  hasCloudflareChatEnv,
  toOpenAiAssistantToolCalls,
  type WorkersAiMessage,
} from '@/lib/chat/cloudflare';
import { toCloudflareTools } from '@/lib/chat/cloudflare-tools';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_ROUNDS = 4;

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1),
});

const SYSTEM_PROMPT = `You are the AusCPI assistant. You help users understand Australian Bureau of Statistics (ABS) Consumer Price Index data.

Rules:
- Only use the provided tools for any numbers, rates, movers, or series values. Never invent CPI figures.
- Cite the as-of month (mm-yyyy) from tool results when stating latest figures.
- Refuse Reserve Bank (RBA) forecasts, cash-rate speculation, and non-CPI topics. Politely redirect to ABS CPI.
- Keep a factual, ABS-accurate tone; short prose is best.
- Prefer get_headline_cpi for headline questions; get_top_movers for movers; for a named item in one city use search_cpi_series → resolve_series → get_cpi_timeseries.
- When the user compares an item across cities/capitals (e.g. food prices across all capital cities), prefer compare_item_across_cities with the canonical ABS item name (search_cpi_series first if unsure). Do not fetch one city at a time.
- For OECD / international / cross-country inflation (not ABS capital cities), use get_oecd_inflation.
- After tools return, summarise clearly for a general audience. Do not dump raw JSON.
- When tool results include UI parts (tables/charts/cards), your final reply must be **brief highlights only** (2–4 short sentences or a short bullet list of insights).
- **Never** output markdown tables, CSV, or a full row-by-row restatement of tool UI data.
- Do not re-list every mover/city/index the UI already shows; pick 1–2 notable callouts and the as-of month.
- Numbers in prose: one decimal for % and index (e.g. 11.5%, 110.2).`;

interface ToolTraceEntry {
  name: string;
  arguments: Record<string, unknown>;
  error?: string;
  asOfMonth?: string;
}



/** Strip markdown tables / fenced table dumps the model sometimes restates. */
function sanitizeAssistantProse(prose: string): string {
  let s = prose;

  // Fenced code blocks that look like tables (pipes or CSV-ish header rows)
  s = s.replace(/```[\w]*\n([\s\S]*?)```/g, (block, body: string) => {
    const lines = body.split('\n').filter((l) => l.trim().length > 0);
    const tableish =
      lines.length > 0 &&
      lines.filter((l) => l.includes('|') || /^\s*[\w .%-]+(,\s*[\w .%-]+)+\s*$/.test(l))
        .length >= Math.ceil(lines.length * 0.5);
    return tableish ? '' : block;
  });

  // Markdown table blocks: consecutive | ... | lines (incl. |---|)
  const lines = s.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const isTableLine =
      /^\|/.test(trimmed) &&
      (trimmed.includes('|', 1) || /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(trimmed));
    if (isTableLine) {
      while (i < lines.length) {
        const t = lines[i].trim();
        const stillTable =
          /^\|/.test(t) &&
          (t.includes('|', 1) || /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(t));
        if (!stillTable) break;
        i++;
      }
      continue;
    }
    out.push(line);
    i++;
  }
  s = out.join('\n');

  // Collapse excessive blank lines
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

function isToolPlumbingErrorText(part: AnswerPart): boolean {
  if (part.type !== 'text') return false;
  const md = part.markdown;
  return (
    md.includes('Invalid arguments') ||
    md.includes('Unknown tool')
  );
}

/** Collect tool UI parts then coalesce for the final JSON response. */
function coalesceAnswerParts(raw: AnswerPart[]): AnswerPart[] {
  const timeseriesSeries: Array<
    Extract<AnswerPart, { type: 'timeseries' }>['series'][number]
  > = [];
  const statCards: Array<
    Extract<AnswerPart, { type: 'stat_cards' }>['cards'][number]
  > = [];
  const other: AnswerPart[] = [];

  for (const part of raw) {
    if (part.type === 'series_list') continue;
    if (isToolPlumbingErrorText(part)) continue;
    if (part.type === 'timeseries') {
      timeseriesSeries.push(...part.series);
      continue;
    }
    if (part.type === 'stat_cards') {
      statCards.push(...part.cards);
      continue;
    }
    other.push(part);
  }

  const out: AnswerPart[] = [];
  if (timeseriesSeries.length > 0) {
    out.push({ type: 'timeseries', series: timeseriesSeries });
  }
  if (statCards.length > 0) {
    out.push({ type: 'stat_cards', cards: statCards });
  }
  out.push(...other);
  return out;
}

function lastUserContent(
  messages: Array<{ role: string; content: string }>
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].content.trim()) {
      return messages[i].content;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!hasCloudflareChatEnv()) {
    return NextResponse.json(
      {
        error:
          'Chat is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env.local (Workers AI Edit token), then restart the dev server.',
        statusCode: 503,
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', statusCode: 400 },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Body must be { messages: { role, content }[] }',
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  if (!lastUserContent(parsed.data.messages)) {
    return NextResponse.json(
      { error: 'Last user message is required', statusCode: 400 },
      { status: 400 }
    );
  }

  const tools = toCloudflareTools();
  const working: WorkersAiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...parsed.data.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const collectedParts: AnswerPart[] = [];
  const toolTrace: ToolTraceEntry[] = [];
  let asOfMonth: string | undefined;

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const ai = await runWorkersAiChat({ messages: working, tools });

      if (ai.tool_calls.length > 0) {
        // glm / OpenAI-compatible: assistant message with nested function tool_calls + ids
        const openAiCalls = toOpenAiAssistantToolCalls(ai.tool_calls);
        const modelReturnedIds = ai.tool_calls.some((c) => Boolean(c.id));

        working.push({
          role: 'assistant',
          content: ai.response || '',
          tool_calls: openAiCalls,
        });

        // Run all tool calls in this round in parallel; append parts/messages in call order
        const results = await Promise.all(
          ai.tool_calls.map((call) => runChatTool(call.name, call.arguments))
        );

        for (let i = 0; i < ai.tool_calls.length; i++) {
          const call = ai.tool_calls[i];
          const result = results[i];
          for (const part of result.ui) {
            collectedParts.push(part);
          }
          if (result.asOfMonth) {
            asOfMonth = result.asOfMonth;
          }
          toolTrace.push({
            name: call.name,
            arguments: call.arguments,
            error: result.error,
            asOfMonth: result.asOfMonth,
          });

          const toolPayload = {
            data: result.data,
            asOfMonth: result.asOfMonth,
            error: result.error,
          };

          const toolMsg: WorkersAiMessage = {
            role: 'tool',
            name: call.name,
            content: JSON.stringify(toolPayload),
          };
          // Pair tool results with tool_call_id when using OpenAI-style ids
          if (modelReturnedIds || openAiCalls[i]?.id) {
            toolMsg.tool_call_id = String(
              call.id ?? openAiCalls[i]?.id ?? `call_${i}`
            );
          }
          working.push(toolMsg);
        }
        continue;
      }

      // Final text response (no tools)
      const parts = coalesceAnswerParts(collectedParts);
      const prose = sanitizeAssistantProse(
        (ai.response && ai.response.trim()) ||
          (parts.length > 0
            ? 'Here is what the ABS data shows.'
            : 'I could not produce an answer. Try rephrasing your question.')
      );

      return NextResponse.json({
        prose,
        parts,
        asOfMonth,
        toolTrace: toolTrace.length > 0 ? toolTrace : undefined,
      });
    }

    // Hit round limit with pending tools — return what we have
    const parts = coalesceAnswerParts(collectedParts);
    return NextResponse.json({
      prose: sanitizeAssistantProse(
        'I gathered some data but hit the tool-call limit before a final summary. See the figures below.'
      ),
      parts,
      asOfMonth,
      toolTrace: toolTrace.length > 0 ? toolTrace : undefined,
    });
  } catch (err) {
    if (err instanceof WorkersAiError) {
      const status =
        err.kind === 'config' ? 503 : err.kind === 'auth' || err.kind === 'quota' ? 502 : 502;
      return NextResponse.json(
        { error: err.message, statusCode: status, kind: err.kind },
        { status }
      );
    }
    console.error('Chat route error:', err);
    return NextResponse.json(
      {
        error: 'Chat failed unexpectedly. Please try again.',
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
