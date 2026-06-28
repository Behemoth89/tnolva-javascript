import { httpStatusToLlmError, toLlmError } from './errors';
import type { LlmClient, LlmClientContext, LlmRequest, LlmResponse } from './types';

const DEFAULT_TIMEOUT_MS = 60_000;

interface OpenAIChatCompletionsResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    finish_reason?: string | null;
    message?: { role?: string; content?: string | null };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function toOpenAIMessages(req: LlmRequest): Array<{ role: string; content: string }> {
  const out: Array<{ role: string; content: string }> = [];
  if (req.system) {
    out.push({ role: 'system', content: req.system });
  }
  for (const m of req.messages) {
    out.push({ role: m.role, content: m.content });
  }
  // req.projectFiles is intentionally NOT forwarded; the OpenAI completions
  // client treats it as opaque context that lives in the chat service only.
  return out;
}

function normalizeFinishReason(reason: string | null | undefined): LlmResponse['finishReason'] {
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

export class OpenAICompletionsClient implements LlmClient {
  async complete(req: LlmRequest, ctx: LlmClientContext): Promise<LlmResponse> {
    const url = joinUrl(ctx.url, '/chat/completions');
    const body = {
      model: req.model,
      messages: toOpenAIMessages(req),
      ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
      ...(req.maxTokens !== undefined ? { max_tokens: req.maxTokens } : {}),
    };
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
    return parseOpenAICompletionsResponse(parsed, ctx.apiKey);
  }
}

function parseOpenAICompletionsResponse(
  raw: unknown,
  apiKey: string,
): LlmResponse {
  const data = raw as OpenAIChatCompletionsResponse;
  const choice = data.choices?.[0];
  const text = (choice?.message?.content ?? '').toString();
  if (!text) {
    throw toLlmError(new Error('Upstream response missing message content'), apiKey);
  }
  return {
    text,
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    },
    finishReason: normalizeFinishReason(choice?.finish_reason),
    raw,
  };
}

function joinUrl(base: string, suffix: string): string {
  return `${stripTrailingSlash(base)}${suffix}`;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}
