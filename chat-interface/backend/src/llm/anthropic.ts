import { httpStatusToLlmError, toLlmError } from './errors';
import type { LlmClient, LlmClientContext, LlmRequest, LlmResponse } from './types';

const DEFAULT_TIMEOUT_MS = 60_000;
const ANTHROPIC_VERSION = '2023-06-08';

interface AnthropicResponse {
  id?: string;
  model?: string;
  content?: Array<{ type?: string; text?: string }>;
  stop_reason?: string | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

function joinUrl(base: string, suffix: string): string {
  return `${base.endsWith('/') ? base.slice(0, -1) : base}${suffix}`;
}

export class AnthropicClient implements LlmClient {
  async complete(req: LlmRequest, ctx: LlmClientContext): Promise<LlmResponse> {
    const url = joinUrl(ctx.url, '/messages');
    const body: Record<string, unknown> = {
      model: req.model,
      max_tokens: req.maxTokens ?? 1024,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    };
    // req.projectFiles is intentionally NOT forwarded; the Anthropic client
    // treats it as opaque context that lives in the chat service only.
    if (req.system) {
      body.system = req.system;
    }
    if (req.temperature !== undefined) {
      body.temperature = req.temperature;
    }
    const headers = {
      'content-type': 'application/json',
      'x-api-key': ctx.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    };
    const fetchImpl = ctx.fetchImpl ?? fetch;
    let res: Response;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: ctx.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
    } catch (err) {
      throw toLlmError(err, ctx.apiKey);
    }
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch (err) {
      throw toLlmError(err, ctx.apiKey);
    }
    if (!res.ok) {
      throw httpStatusToLlmError(res.status, parsed, ctx.apiKey);
    }
    return parseAnthropicResponse(parsed, ctx.apiKey);
  }
}

function parseAnthropicResponse(raw: unknown, apiKey: string): LlmResponse {
  const data = raw as AnthropicResponse;
  let text = '';
  if (Array.isArray(data.content)) {
    for (const c of data.content) {
      if (typeof c.text === 'string' && c.text.length > 0) {
        text += c.text;
      }
    }
  }
  if (!text) {
    throw toLlmError(new Error('Upstream response missing text content'), apiKey);
  }
  return {
    text,
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    },
    finishReason: normalizeFinishReason(data.stop_reason),
    raw,
  };
}

function normalizeFinishReason(
  reason: string | null | undefined,
): LlmResponse['finishReason'] {
  switch (reason) {
    case 'end_turn':
    case 'stop_sequence':
    case 'max_tokens':
    case 'tool_use':
      return reason === 'end_turn' || reason === 'stop_sequence'
        ? 'stop'
        : reason === 'max_tokens'
          ? 'length'
          : 'tool_use';
    default:
      return 'unknown';
  }
}
