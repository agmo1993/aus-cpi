/**
 * Cloudflare Workers AI REST client for chat tool selection + short prose.
 * Server-only — uses CLOUDFLARE_* secrets from env.
 *
 * Supports both legacy Hermes-style `{ response, tool_calls }` and OpenAI
 * chat.completion `choices[0].message` (used by glm-4.7-flash).
 */

import { env, hasCloudflareChatEnv } from '@/lib/env';
import type { CloudflareToolDef } from './cloudflare-tools';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

/** OpenAI wire shape for assistant tool_calls sent back to Workers AI. */
export interface WorkersAiOpenAiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface WorkersAiMessage {
  role: ChatRole;
  content: string;
  name?: string;
  /** Present on tool-role messages when pairing with OpenAI-style tool_call ids. */
  tool_call_id?: string;
  /** Normalized (inbound) or OpenAI wire (outbound to glm). */
  tool_calls?: WorkersAiToolCall[] | WorkersAiOpenAiToolCall[];
}

/** Normalized tool call; `id` preserved when the model returns OpenAI-style ids. */
export interface WorkersAiToolCall {
  id?: string;
  type?: 'function';
  name: string;
  arguments: Record<string, unknown>;
}

export interface WorkersAiChatResult {
  response: string;
  tool_calls: WorkersAiToolCall[];
  raw: unknown;
}

export class WorkersAiError extends Error {
  status: number;
  kind: 'quota' | 'auth' | 'config' | 'upstream';

  constructor(
    message: string,
    status: number,
    kind: WorkersAiError['kind'] = 'upstream'
  ) {
    super(message);
    this.name = 'WorkersAiError';
    this.status = status;
    this.kind = kind;
  }
}

function parseArguments(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function normalizeToolCalls(raw: unknown): WorkersAiToolCall[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      // OpenAI / glm nest under function: { name, arguments }
      const fn =
        obj.function && typeof obj.function === 'object'
          ? (obj.function as Record<string, unknown>)
          : null;
      const name = String(fn?.name ?? obj.name ?? '').trim();
      if (!name) return null;
      const args = parseArguments(fn?.arguments ?? obj.arguments ?? obj.args);
      const id =
        typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : undefined;
      const call: WorkersAiToolCall = { name, arguments: args };
      if (id) call.id = id;
      if (obj.type === 'function' || fn) call.type = 'function';
      return call;
    })
    .filter((t): t is WorkersAiToolCall => t != null);
}

function extractResultPayload(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};
  const root = body as Record<string, unknown>;
  const result = root.result;
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result as Record<string, unknown>;
  }
  return root;
}

/**
 * Resolve message content + tool_calls from either:
 * - legacy: result.response / result.tool_calls
 * - OpenAI chat.completion: result.choices[0].message
 */
function extractMessageFields(payload: Record<string, unknown>): {
  response: string;
  tool_calls: WorkersAiToolCall[];
} {
  // Prefer OpenAI chat.completion shape when choices are present
  const choices = payload.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0];
    if (first && typeof first === 'object') {
      const choice = first as Record<string, unknown>;
      const message =
        choice.message && typeof choice.message === 'object'
          ? (choice.message as Record<string, unknown>)
          : null;
      if (message) {
        let response = '';
        if (typeof message.content === 'string') {
          response = message.content;
        } else if (message.content == null) {
          response = '';
        }
        const tool_calls = normalizeToolCalls(
          message.tool_calls ?? message.toolCalls ?? []
        );
        return { response, tool_calls };
      }
    }
  }

  // Legacy Hermes-style / flat result
  const tool_calls = normalizeToolCalls(
    payload.tool_calls ?? payload.toolCalls ?? []
  );

  let response = '';
  if (typeof payload.response === 'string') {
    response = payload.response;
  } else if (typeof payload.text === 'string') {
    response = payload.text;
  } else if (typeof payload.result === 'string') {
    response = payload.result;
  } else if (
    payload.message &&
    typeof payload.message === 'object' &&
    typeof (payload.message as { content?: unknown }).content === 'string'
  ) {
    response = (payload.message as { content: string }).content;
    // Also pick tool_calls from nested message if top-level was empty
    if (tool_calls.length === 0) {
      const msg = payload.message as Record<string, unknown>;
      return {
        response,
        tool_calls: normalizeToolCalls(msg.tool_calls ?? msg.toolCalls ?? []),
      };
    }
  }

  return { response, tool_calls };
}

function friendlyErrorFromStatus(status: number, detail: string): WorkersAiError {
  if (status === 401 || status === 403) {
    return new WorkersAiError(
      'Cloudflare Workers AI authentication failed. Check CLOUDFLARE_API_TOKEN permissions (Workers AI Edit).',
      status,
      'auth'
    );
  }
  if (status === 429) {
    return new WorkersAiError(
      'Daily Workers AI quota may be exhausted. Try again tomorrow or upgrade your Cloudflare plan.',
      status,
      'quota'
    );
  }
  const lower = detail.toLowerCase();
  if (
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('exhausted') ||
    lower.includes('too many requests')
  ) {
    return new WorkersAiError(
      'Daily Workers AI quota may be exhausted. Try again tomorrow or upgrade your Cloudflare plan.',
      status || 429,
      'quota'
    );
  }
  return new WorkersAiError(
    detail || `Workers AI request failed (${status})`,
    status || 502,
    'upstream'
  );
}

/**
 * Serialize tool_calls for the next request in OpenAI shape when ids are present
 * (glm accepts { id, type, function: { name, arguments } }).
 */
export function toOpenAiAssistantToolCalls(
  calls: WorkersAiToolCall[]
): WorkersAiOpenAiToolCall[] {
  return calls.map((call, i) => {
    const id = call.id ?? `call_${i}`;
    return {
      id,
      type: 'function' as const,
      function: {
        name: call.name,
        arguments: JSON.stringify(call.arguments ?? {}),
      },
    };
  });
}

/**
 * POST messages + tools to Cloudflare Workers AI and parse tool_calls / response.
 */
export async function runWorkersAiChat(opts: {
  messages: WorkersAiMessage[];
  tools: CloudflareToolDef[];
}): Promise<WorkersAiChatResult> {
  if (!hasCloudflareChatEnv()) {
    throw new WorkersAiError(
      'Cloudflare Workers AI is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.',
      503,
      'config'
    );
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID!;
  const token = env.CLOUDFLARE_API_TOKEN!;
  const model = env.CHAT_MODEL;

  // Model ids contain @ and /; Cloudflare expects them unencoded in the path.
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: opts.messages,
        tools: opts.tools,
      }),
    });
  } catch (err) {
    throw new WorkersAiError(
      `Could not reach Cloudflare Workers AI: ${err instanceof Error ? err.message : String(err)}`,
      502,
      'upstream'
    );
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const detail =
      (body &&
        typeof body === 'object' &&
        'errors' in body &&
        Array.isArray((body as { errors: unknown }).errors) &&
        ((body as { errors: Array<{ message?: string }> }).errors[0]?.message ||
          JSON.stringify((body as { errors: unknown }).errors))) ||
      (body &&
        typeof body === 'object' &&
        'error' in body &&
        String((body as { error: unknown }).error)) ||
      text.slice(0, 400) ||
      res.statusText;
    throw friendlyErrorFromStatus(res.status, String(detail));
  }

  const payload = extractResultPayload(body);
  const { response, tool_calls } = extractMessageFields(payload);

  return { response, tool_calls, raw: body };
}

export { hasCloudflareChatEnv };
