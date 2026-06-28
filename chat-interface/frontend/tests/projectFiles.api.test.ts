import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import * as api from '../src/api/projectFiles';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type FetchSpy = MockInstance<typeof fetch>;

describe('projectFiles API client (unit)', () => {
  let fetchSpy: FetchSpy;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('listProjectFiles hits /api/projects/:id/files with credentials', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ items: [], total: 0, limit: 50, offset: 0 }),
    );
    await api.listProjectFiles(7);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/projects/7/files');
    expect(init?.credentials).toBe('include');
  });

  it('listProjectFiles with a source filter adds ?source=...', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ items: [], total: 0, limit: 50, offset: 0 }),
    );
    await api.listProjectFiles(7, { source: 'chat_upload' });
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/projects/7/files?source=chat_upload');
  });

  it('uploadProjectFile posts multipart with source=chat_upload and credentials', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        id: 1,
        project_id: 1,
        user_id: 1,
        filename: 'a.txt',
        mime_type: 'text/plain',
        size_bytes: 1,
        source: 'chat_upload',
        source_chat_id: null,
        source_message_id: null,
        created_at: 'c',
        updated_at: 'c',
      }),
    );
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' });
    await api.uploadProjectFile(1, file, { source: 'chat_upload' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/projects/1/files');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('include');
    const form = init?.body as FormData;
    expect(form.get('file')).toBe(file);
    expect(form.get('source')).toBe('chat_upload');
  });

  it('saveLlmGeneratedFile posts the right body', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        id: 2,
        project_id: 1,
        user_id: 1,
        filename: 'spec.md',
        mime_type: 'text/markdown',
        size_bytes: 8,
        source: 'llm_generated',
        source_chat_id: 7,
        source_message_id: 9,
        created_at: 'c',
        updated_at: 'c',
      }),
    );
    await api.saveLlmGeneratedFile(1, {
      chat_id: 7,
      message_id: 9,
      attachment_index: 0,
    });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/projects/1/files/from-message');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(
      JSON.stringify({ chat_id: 7, message_id: 9, attachment_index: 0 }),
    );
  });

  it('downloadProjectFileUrl returns a relative path', () => {
    expect(api.downloadProjectFileUrl(42)).toBe('/api/projects/files/42');
  });

  it('throws on 413 with the server error message', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'File too large' }, 413));
    await expect(api.deleteProjectFile(1)).rejects.toThrow('File too large');
  });
});
