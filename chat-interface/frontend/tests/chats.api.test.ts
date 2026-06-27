import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import * as api from '../src/api/chats';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function noContentResponse(status = 204): Response {
  return new Response(null, { status });
}

type FetchSpy = MockInstance<typeof fetch>;

describe('chats API client (unit)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('listChats GETs /api/chats with credentials', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse([]));
    const result = await api.listChats();
    expect(result).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/chats',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('listAvailableModels GETs /api/chats/models', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse([
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ]),
    );
    const list = await api.listAvailableModels();
    expect(list).toHaveLength(1);
    expect(list[0].provider_model).toBe('openai:gpt-x');
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/chats/models');
  });

  it('createChat POSTs JSON body to /api/chats', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        id: 1,
        user_id: 1,
        title: 't',
        default_llm_provider_model: 'openai:gpt-x',
        created_at: 'c',
      }),
    );
    await api.createChat({ title: 't', default_llm_provider_model: 'openai:gpt-x' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/chats');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(
      JSON.stringify({ title: 't', default_llm_provider_model: 'openai:gpt-x' }),
    );
  });

  it('getChat hits the per-id URL', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ chat: { id: 1, user_id: 1, title: null, default_llm_provider_model: 'openai:gpt-x', created_at: 'c' }, messages: [] }),
    );
    await api.getChat(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/chats/1');
  });

  it('updateChat PATCHes JSON body', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ id: 1, user_id: 1, title: 'new', default_llm_provider_model: 'openai:gpt-x', created_at: 'c' }),
    );
    await api.updateChat(1, { title: 'new' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/chats/1');
    expect(init?.method).toBe('PATCH');
    expect(init?.body).toBe(JSON.stringify({ title: 'new' }));
  });

  it('deleteChat DELETEs and accepts 204', async () => {
    fetchSpy.mockResolvedValueOnce(noContentResponse(204));
    await api.deleteChat(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/chats/1');
    expect(init?.method).toBe('DELETE');
  });

  it('sendMessage returns the discriminated union on success', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        chat: { id: 1, user_id: 1, title: null, default_llm_provider_model: 'openai:gpt-x', created_at: 'c' },
        messages: [
          { id: 1, chat_id: 1, role: 'user', content: 'hi', provider_model: 'openai:gpt-x', created_at: 'c' },
        ],
      }),
    );
    const result = await api.sendMessage(1, { content: 'hi' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.messages).toHaveLength(1);
  });

  it('sendMessage returns the failure union on 502 with the partial chat', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(
        {
          error: 'Upstream LLM failed: http',
          chat: {
            chat: { id: 1, user_id: 1, title: null, default_llm_provider_model: 'openai:gpt-x', created_at: 'c' },
            messages: [
              { id: 1, chat_id: 1, role: 'user', content: 'hi', provider_model: 'openai:gpt-x', created_at: 'c' },
            ],
          },
        },
        502,
      ),
    );
    const result = await api.sendMessage(1, { content: 'hi' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Upstream LLM failed: http');
    expect(result.chat.messages).toHaveLength(1);
  });

  it('sendMessage throws on 400 with the server error message', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'content must be a non-empty string' }, 400));
    await expect(api.sendMessage(1, { content: '' })).rejects.toThrow(
      'content must be a non-empty string',
    );
  });

  it('rejects with a generic message when the body has no error field', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('oops', { status: 500 }));
    await expect(api.listChats()).rejects.toThrow('Request failed with status 500');
  });
});
