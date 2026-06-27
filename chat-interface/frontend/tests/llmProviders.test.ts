import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import * as api from '../src/api/llmProviders';

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

describe('llmProviders API client (unit)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('listProviders GETs /api/admin/llm-providers with credentials', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse([]));
    const result = await api.listProviders();
    expect(result).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/admin/llm-providers',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('getProvider hits the per-id URL', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ id: 1, name: 'p', url: 'u', api_key: '********', type: 'anthropic', created_at: 't' }),
    );
    await api.getProvider(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/admin/llm-providers/1');
  });

  it('createProvider POSTs JSON body', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ id: 1, name: 'p', url: 'u', api_key: '********', type: 'openai_completions', created_at: 't' }),
    );
    await api.createProvider({
      name: 'p',
      url: 'u',
      api_key: 'sk-x',
      type: 'openai_completions',
    });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/admin/llm-providers');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(
      JSON.stringify({ name: 'p', url: 'u', api_key: 'sk-x', type: 'openai_completions' }),
    );
  });

  it('updateProvider PUTs the supplied fields', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ id: 1, name: 'p2', url: 'u', api_key: '********', type: 'openai_completions', created_at: 't' }),
    );
    await api.updateProvider(1, { name: 'p2' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/admin/llm-providers/1');
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ name: 'p2' }));
  });

  it('deleteProvider DELETEs and accepts 204', async () => {
    fetchSpy.mockResolvedValueOnce(noContentResponse(204));
    await api.deleteProvider(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/admin/llm-providers/1');
    expect(init?.method).toBe('DELETE');
  });

  it('listModels without provider_id hits the unfiltered URL', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse([]));
    await api.listModels();
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/admin/llm-provider-models');
  });

  it('listModels with provider_id appends the query string', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse([]));
    await api.listModels(7);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/admin/llm-provider-models?provider_id=7');
  });

  it('createModel POSTs JSON body', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ id: 1, llm_provider_id: 2, name: 'gpt-4o', created_at: 't' }),
    );
    await api.createModel({ llm_provider_id: 2, name: 'gpt-4o' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/admin/llm-provider-models');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ llm_provider_id: 2, name: 'gpt-4o' }));
  });

  it('updateModel PUTs the supplied fields', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ id: 1, llm_provider_id: 2, name: 'gpt-4o-mini', created_at: 't' }),
    );
    await api.updateModel(1, { name: 'gpt-4o-mini' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/admin/llm-provider-models/1');
    expect(init?.method).toBe('PUT');
  });

  it('deleteModel DELETEs and accepts 204', async () => {
    fetchSpy.mockResolvedValueOnce(noContentResponse(204));
    await api.deleteModel(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/admin/llm-provider-models/1');
    expect(init?.method).toBe('DELETE');
  });

  it('rejects with the server error message on a non-2xx', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'Invalid type' }, 400));
    await expect(api.listProviders()).rejects.toThrow('Invalid type');
  });

  it('rejects with a generic message when the body has no error field', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('oops', { status: 500 }));
    await expect(api.listProviders()).rejects.toThrow('Request failed with status 500');
  });
});
