import { LlmError, type LlmErrorKind } from './types';

export { LlmError };
export type { LlmErrorKind };

const REDACTED = '[redacted]';

function redactString(input: string, apiKey: string): string {
  if (!apiKey) {
    return input;
  }
  return input.split(apiKey).join(REDACTED);
}

function redactUnknown(value: unknown, apiKey: string): unknown {
  if (typeof value === 'string') {
    return redactString(value, apiKey);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactUnknown(v, apiKey);
    }
    return out;
  }
  return value;
}

function classifyStatus(status: number): LlmErrorKind {
  if (status === 429) {
    return 'rate_limited';
  }
  return 'http';
}

export function toLlmError(err: unknown, apiKey: string): LlmError {
  if (err instanceof LlmError) {
    return err;
  }
  if (err instanceof Error) {
    const name = err.name;
    const isAbort = name === 'AbortError' || name === 'TimeoutError';
    const message = redactString(err.message, apiKey);
    return new LlmError({
      kind: isAbort ? 'network' : 'parse',
      message: isAbort ? `Upstream request aborted (${message || 'timeout'})` : message,
    });
  }
  return new LlmError({
    kind: 'parse',
    message: redactString(typeof err === 'string' ? err : 'Unknown LLM error', apiKey),
  });
}

export function httpStatusToLlmError(
  status: number,
  body: unknown,
  apiKey: string,
): LlmError {
  const kind = classifyStatus(status);
  const redactedBody = redactUnknown(body, apiKey);
  const summary = describeBody(body);
  return new LlmError({
    kind,
    status,
    message: `Upstream returned ${status}${summary ? `: ${summary}` : ''}`,
    raw: redactedBody,
  });
}

function describeBody(body: unknown): string {
  if (body && typeof body === 'object') {
    const err = (body as { error?: { message?: unknown } }).error;
    if (err && typeof err === 'object' && typeof err.message === 'string') {
      return err.message;
    }
    const msg = (body as { message?: unknown }).message;
    if (typeof msg === 'string') {
      return msg;
    }
  }
  if (typeof body === 'string' && body.length > 0) {
    return body.slice(0, 200);
  }
  return '';
}

export function isLlmError(err: unknown): err is LlmError {
  return err instanceof LlmError;
}
