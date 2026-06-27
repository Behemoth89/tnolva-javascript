export type LLMProviderType = 'openai_completions' | 'openai_responses' | 'anthropic';

export const LLM_PROVIDER_TYPES: readonly LLMProviderType[] = [
  'openai_completions',
  'openai_responses',
  'anthropic',
] as const;

export type LlmMessageRole = 'user' | 'assistant';

export interface LlmMessage {
  role: LlmMessageRole;
  content: string;
}

export interface LlmRequest {
  model: string;
  system?: string;
  messages: ReadonlyArray<LlmMessage>;
  temperature?: number;
  maxTokens?: number;
}

export type LlmFinishReason =
  | 'stop'
  | 'length'
  | 'content_filter'
  | 'tool_use'
  | 'error'
  | 'unknown';

export interface LlmResponse {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  finishReason: LlmFinishReason;
  raw: unknown;
}

export type LlmErrorKind = 'network' | 'http' | 'parse' | 'rate_limited';

export interface LlmErrorOptions {
  kind: LlmErrorKind;
  status?: number;
  message: string;
  raw?: unknown;
}

export class LlmError extends Error {
  public readonly kind: LlmErrorKind;
  public readonly status: number | undefined;
  public readonly raw: unknown;

  constructor(options: LlmErrorOptions) {
    super(options.message);
    this.name = 'LlmError';
    this.kind = options.kind;
    this.status = options.status;
    this.raw = options.raw;
  }
}

export interface LlmClientContext {
  url: string;
  apiKey: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export interface LlmClient {
  complete(req: LlmRequest, ctx: LlmClientContext): Promise<LlmResponse>;
}
