import { httpStatusToLlmError, toLlmError } from './errors';
import type { LlmClient, LlmClientContext, LlmRequest, LlmResponse } from './types';

const DEFAULT_TIMEOUT_MS = 60_000;

interface OpenAIResponsesResponse {
  id?: string;
  model?: string;
  output?: Array<{
    type?: string;
    role?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  output_text?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  stop_reason?: string | null;
  incomplete_reason?: string | null;
}

function joinUrl(base: string, suffix: string): string {
  return `${base.endsWith('/') ? base.slice(0, -1) : base}${suffix}`;
}

export class OpenAIResponsesClient implements LlmClient {
  async complete(req: LlmRequest, ctx: LlmClientContext): Promise<LlmResponse> {
    const url = joinUrl(ctx.url, '/responses');
    const body: Record<string, unknown> = {
      model: req.model,
      input: req.messages.map((m) => ({ role: m.role, content: m.content })),
    };
    // req.projectFiles is intentionally NOT forwarded; the OpenAI responses
    // client treats it as opaque context that lives in the chat service only.
    if (req.system) {
      body.instructions = req.system;
    }
    if (req.temperature !== undefined) {
      body.temperature = req.temperature;
    }
    if (req.maxTokens !== undefined) {
      body.max_output_tokens = req.maxTokens;
    }
    const headers = {
      'content-type': 'application/json',
      authorization: `Bearer ${ctx.apiKey}`,
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
    return parseOpenAIResponsesResponse(parsed, ctx.apiKey);
  }
}

function parseOpenAIResponsesResponse(
  raw: unknown,
  apiKey: string,
): LlmResponse {
  const data = raw as OpenAIResponsesResponse;
  let text = data.output_text ?? '';
  if (!text && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (Array.isArray(item.content)) {
        for (const c of item.content) {
          if (typeof c.text === 'string' && c.text.length > 0) {
            text += c.text;
          }
        }
      }
    }
  }
  if (!text) {
    throw toLlmError(new Error('Upstream response missing output text'), apiKey);
  }
  return {
    text,
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    },
    finishReason: normalizeFinishReason(data.stop_reason ?? data.incomplete_reason),
    raw,
  };
}

function normalizeFinishReason(
  reason: string | null | undefined,
): LlmResponse['finishReason'] {
  switch (reason) {
    case 'stop':
    case 'length':
    case 'content_filter':
    case 'tool_use':
      return reason;
    default:
      return 'unknown';
  }
}
