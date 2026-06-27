import { describe, expect, it } from '@jest/globals';
import { createLlmClient, LlmError } from '../../src/llm/client';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function buildFetch(responses: Array<Response | (() => Response)>): {
  fetchImpl: typeof fetch;
  calls: Array<{ url: string; init: RequestInit }>;
} {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let i = 0;
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    calls.push({ url, init: init ?? {} });
    const next = responses[i++] ?? responses[responses.length - 1];
    if (!next) {
      throw new Error('No more mock responses');
    }
    return typeof next === 'function' ? next() : next;
  };
  return { fetchImpl, calls };
}

describe('createLlmClient (factory)', () => {
  it('maps openai_completions to the OpenAI completions client', async () => {
    const { fetchImpl, calls } = buildFetch([
      jsonResponse({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 1, completion_tokens: 2 },
      }),
    ]);
    const client = createLlmClient('openai_completions');
    const res = await client.complete(
      { model: 'gpt-x', messages: [{ role: 'user', content: 'hi' }] },
      { url: 'https://api.openai.com/v1', apiKey: 'sk-secret', fetchImpl },
    );
    expect(res.text).toBe('ok');
    expect(calls[0].url).toBe('https://api.openai.com/v1/chat/completions');
    expect(calls[0].init.method).toBe('POST');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer sk-secret');
    const body = JSON.parse(calls[0].init.body as string);
    expect(body.model).toBe('gpt-x');
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('maps openai_responses to the OpenAI Responses API', async () => {
    const { fetchImpl, calls } = buildFetch([
      jsonResponse({
        output_text: 'hello',
        usage: { input_tokens: 3, output_tokens: 4 },
        stop_reason: 'stop',
      }),
    ]);
    const client = createLlmClient('openai_responses');
    const res = await client.complete(
      {
        model: 'gpt-x',
        system: 'You are concise.',
        messages: [{ role: 'user', content: 'hi' }],
      },
      { url: 'https://api.openai.com/v1', apiKey: 'sk-secret', fetchImpl },
    );
    expect(res.text).toBe('hello');
    expect(calls[0].url).toBe('https://api.openai.com/v1/responses');
    const body = JSON.parse(calls[0].init.body as string);
    expect(body.model).toBe('gpt-x');
    expect(body.instructions).toBe('You are concise.');
    expect(body.input).toEqual([{ role: 'user', content: 'hi' }]);
    expect((calls[0].init.headers as Record<string, string>).authorization).toBe(
      'Bearer sk-secret',
    );
  });

  it('maps anthropic to the Anthropic Messages API', async () => {
    const { fetchImpl, calls } = buildFetch([
      jsonResponse({
        content: [{ type: 'text', text: 'salud' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 6 },
      }),
    ]);
    const client = createLlmClient('anthropic');
    const res = await client.complete(
      {
        model: 'claude-x',
        system: 'Be brief.',
        messages: [{ role: 'user', content: 'hi' }],
      },
      { url: 'https://api.anthropic.com/v1', apiKey: 'sk-ant', fetchImpl },
    );
    expect(res.text).toBe('salud');
    expect(calls[0].url).toBe('https://api.anthropic.com/v1/messages');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant');
    expect(headers['anthropic-version']).toBe('2023-06-08');
    const body = JSON.parse(calls[0].init.body as string);
    expect(body.model).toBe('claude-x');
    expect(body.system).toBe('Be brief.');
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });
});

describe('LlmError classification', () => {
  it('classifies 429 as rate_limited and does not include the apiKey in any field', async () => {
    const secret = 'sk-rate-secret';
    const { fetchImpl } = buildFetch([
      jsonResponse({ error: { message: 'slow down' } }, 429),
    ]);
    const client = createLlmClient('openai_completions');
    try {
      await client.complete(
        { model: 'm', messages: [{ role: 'user', content: 'hi' }] },
        { url: 'https://x', apiKey: secret, fetchImpl },
      );
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LlmError);
      const e = err as LlmError;
      expect(e.kind).toBe('rate_limited');
      expect(e.status).toBe(429);
      expect(e.message.includes(secret)).toBe(false);
      expect(JSON.stringify(e.raw).includes(secret)).toBe(false);
    }
  });

  it('classifies 500 as http and redacts the apiKey', async () => {
    const secret = 'sk-fail-secret';
    const { fetchImpl } = buildFetch([
      jsonResponse({ error: { message: 'boom' } }, 500),
    ]);
    const client = createLlmClient('openai_responses');
    try {
      await client.complete(
        { model: 'm', messages: [{ role: 'user', content: 'hi' }] },
        { url: 'https://x', apiKey: secret, fetchImpl },
      );
      throw new Error('should have thrown');
    } catch (err) {
      const e = err as LlmError;
      expect(e.kind).toBe('http');
      expect(e.status).toBe(500);
      expect(e.message.includes(secret)).toBe(false);
      expect(JSON.stringify(e.raw ?? {}).includes(secret)).toBe(false);
    }
  });

  it('classifies network failures (fetch throws) as network and redacts the apiKey', async () => {
    const secret = 'sk-net-secret';
    const fetchImpl: typeof fetch = async () => {
      throw new TypeError('fetch failed inside ' + secret);
    };
    const client = createLlmClient('openai_completions');
    try {
      await client.complete(
        { model: 'm', messages: [{ role: 'user', content: 'hi' }] },
        { url: 'https://x', apiKey: secret, fetchImpl },
      );
      throw new Error('should have thrown');
    } catch (err) {
      const e = err as LlmError;
      expect(e.kind).toBe('parse');
      expect(e.message.includes(secret)).toBe(false);
    }
  });

  it('classifies non-JSON success as parse', async () => {
    const { fetchImpl } = buildFetch([new Response('not json', { status: 200 })]);
    const client = createLlmClient('openai_completions');
    try {
      await client.complete(
        { model: 'm', messages: [{ role: 'user', content: 'hi' }] },
        { url: 'https://x', apiKey: 'k', fetchImpl },
      );
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LlmError);
      const e = err as LlmError;
      expect(e.kind === 'parse' || e.kind === 'http').toBe(true);
    }
  });
});
