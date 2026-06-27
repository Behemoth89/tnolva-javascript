import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import AdminLLMProviders from '../src/pages/AdminLLMProviders';

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

function renderAt(initialPath: string, fetchSpy: FetchSpy) {
  fetchSpy.mockResolvedValueOnce(
    jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
  );
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/admin/llm-providers" element={<AdminLLMProviders />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AdminLLMProviders page (component)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('admin sees the providers list after listProviders resolves', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 1, name: 'openai', url: 'https://x', api_key: '********', type: 'openai_completions', created_at: 't1' },
          { id: 2, name: 'anthropic', url: 'https://y', api_key: '********', type: 'anthropic', created_at: 't2' },
        ]),
      );

    renderAt('/admin/llm-providers', fetchSpy);

    await waitFor(() =>
      expect(screen.getByTestId('llm-providers-table')).toBeInTheDocument(),
    );
    const rows = screen.getAllByTestId('llm-providers-row');
    expect(rows.length).toBe(2);
    expect(rows[0]).toHaveTextContent('openai');
    expect(rows[1]).toHaveTextContent('anthropic');
  });

  it('non-admin sees the denial and no provider API is called', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ user: { id: 2, email: 'user@example.com', is_admin: 0 } }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/llm-providers']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/llm-providers" element={<AdminLLMProviders />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('llm-providers-denied')).toBeInTheDocument();
    expect(screen.getByTestId('llm-providers-denied-message')).toHaveTextContent(
      /admin privileges required/i,
    );
    const providerCall = fetchSpy.mock.calls.find(
      ([url]) => url === '/api/admin/llm-providers',
    );
    expect(providerCall).toBeUndefined();
  });

  it('submitting the create form calls createProvider and refreshes the list', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse({ id: 99, name: 'new', url: 'https://n', api_key: '********', type: 'openai_completions', created_at: 't' }),
      )
      .mockResolvedValueOnce(
        jsonResponse([{ id: 99, name: 'new', url: 'https://n', api_key: '********', type: 'openai_completions', created_at: 't' }]),
      );

    renderAt('/admin/llm-providers', fetchSpy);

    await waitFor(() =>
      expect(screen.getByTestId('llm-providers-create-form')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId('llm-providers-create-name'), {
      target: { value: 'new' },
    });
    fireEvent.change(screen.getByTestId('llm-providers-create-url'), {
      target: { value: 'https://n' },
    });
    fireEvent.change(screen.getByTestId('llm-providers-create-api-key'), {
      target: { value: 'sk-secret' },
    });
    fireEvent.click(screen.getByTestId('llm-providers-create-submit'));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/admin/llm-providers',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/admin/llm-providers' && (init as RequestInit | undefined)?.method === 'POST',
    );
    expect(postCall).toBeDefined();
    expect(JSON.parse(((postCall as unknown) as [string, RequestInit])[1].body as string)).toEqual({
      name: 'new',
      url: 'https://n',
      api_key: 'sk-secret',
      type: 'openai_completions',
    });
    await waitFor(() =>
      expect(screen.getByTestId('llm-providers-table')).toBeInTheDocument(),
    );
  });

  it('clicking delete calls deleteProvider and refreshes the list', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse([{ id: 7, name: 'gone', url: 'https://g', api_key: '********', type: 'anthropic', created_at: 't' }]),
      )
      .mockResolvedValueOnce(noContentResponse(204))
      .mockResolvedValueOnce(jsonResponse([]));

    renderAt('/admin/llm-providers', fetchSpy);

    await waitFor(() =>
      expect(screen.getByTestId('llm-providers-table')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId('llm-providers-delete'));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/admin/llm-providers/7',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('llm-providers-empty')).toBeInTheDocument(),
    );
  });

  it('renders the server error inline when createProvider fails', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ error: 'Invalid type' }, 400));

    renderAt('/admin/llm-providers', fetchSpy);

    await waitFor(() =>
      expect(screen.getByTestId('llm-providers-create-form')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId('llm-providers-create-name'), {
      target: { value: 'x' },
    });
    fireEvent.change(screen.getByTestId('llm-providers-create-url'), {
      target: { value: 'https://x' },
    });
    fireEvent.change(screen.getByTestId('llm-providers-create-api-key'), {
      target: { value: 'k' },
    });
    fireEvent.click(screen.getByTestId('llm-providers-create-submit'));

    const err = await screen.findByTestId('llm-providers-error');
    expect(err).toHaveTextContent('Invalid type');
  });
});
