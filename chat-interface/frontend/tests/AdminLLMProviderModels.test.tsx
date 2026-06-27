import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import AdminLLMProviderModels from '../src/pages/AdminLLMProviderModels';

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
          <Route path="/admin/llm-provider-models" element={<AdminLLMProviderModels />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AdminLLMProviderModels page (component)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('admin sees the models table with provider names', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 1, name: 'openai', url: 'u', api_key: '********', type: 'openai_completions', created_at: 't' },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 11, llm_provider_id: 1, name: 'gpt-4o', created_at: 't1' },
        ]),
      );

    renderAt('/admin/llm-provider-models', fetchSpy);

    await waitFor(() =>
      expect(screen.getByTestId('llm-models-table')).toBeInTheDocument(),
    );
    const rows = screen.getAllByTestId('llm-models-row');
    expect(rows.length).toBe(1);
    expect(rows[0]).toHaveTextContent('gpt-4o');
    expect(rows[0]).toHaveTextContent('openai');
  });

  it('non-admin sees the denial and no model API is called', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ user: { id: 2, email: 'user@example.com', is_admin: 0 } }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/llm-provider-models']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/llm-provider-models" element={<AdminLLMProviderModels />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('llm-models-denied')).toBeInTheDocument();
    expect(screen.getByTestId('llm-models-denied-message')).toHaveTextContent(
      /admin privileges required/i,
    );
    const modelCall = fetchSpy.mock.calls.find(([url]) =>
      url === '/api/admin/llm-provider-models' || (typeof url === 'string' && url.startsWith('/api/admin/llm-provider-models')),
    );
    expect(modelCall).toBeUndefined();
  });

  it('selecting a provider calls listModels with the provider_id', async () => {
    const user = userEvent.setup();
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 1, name: 'openai', url: 'u', api_key: '********', type: 'openai_completions', created_at: 't' },
          { id: 2, name: 'anthropic', url: 'u2', api_key: '********', type: 'anthropic', created_at: 't2' },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse([{ id: 5, llm_provider_id: 2, name: 'claude-3', created_at: 't' }]),
      );

    renderAt('/admin/llm-provider-models', fetchSpy);

    await waitFor(() =>
      expect(screen.getByTestId('llm-models-filter')).toBeInTheDocument(),
    );
    await waitFor(() => {
      const filter = screen.getByTestId('llm-models-filter') as HTMLSelectElement;
      expect(filter.options.length).toBeGreaterThan(1);
    });

    await user.selectOptions(screen.getByTestId('llm-models-filter'), '2');

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/admin/llm-provider-models?provider_id=2',
        expect.objectContaining({}),
      ),
    );
  });

  it('submitting the create form calls createModel and refreshes', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse([{ id: 1, name: 'openai', url: 'u', api_key: '********', type: 'openai_completions', created_at: 't' }]),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse({ id: 99, llm_provider_id: 1, name: 'gpt-4o', created_at: 't' }),
      )
      .mockResolvedValueOnce(jsonResponse([]));

    renderAt('/admin/llm-provider-models', fetchSpy);

    await waitFor(() =>
      expect(screen.getByTestId('llm-models-create-form')).toBeInTheDocument(),
    );
    await waitFor(() => {
      const sel = screen.getByTestId('llm-models-create-provider') as HTMLSelectElement;
      expect(sel.options.length).toBeGreaterThan(1);
    });

    fireEvent.change(screen.getByTestId('llm-models-create-provider'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('llm-models-create-name'), {
      target: { value: 'gpt-4o' },
    });
    fireEvent.click(screen.getByTestId('llm-models-create-submit'));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/admin/llm-provider-models',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/admin/llm-provider-models' && (init as RequestInit | undefined)?.method === 'POST',
    );
    expect(JSON.parse(((postCall as unknown) as [string, RequestInit])[1].body as string)).toEqual({
      llm_provider_id: 1,
      name: 'gpt-4o',
    });
  });

  it('clicking delete calls deleteModel and refreshes', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse([{ id: 1, name: 'openai', url: 'u', api_key: '********', type: 'openai_completions', created_at: 't' }]),
      )
      .mockResolvedValueOnce(
        jsonResponse([{ id: 12, llm_provider_id: 1, name: 'gpt-4o', created_at: 't' }]),
      )
      .mockResolvedValueOnce(noContentResponse(204))
      .mockResolvedValueOnce(jsonResponse([]));

    renderAt('/admin/llm-provider-models', fetchSpy);

    await waitFor(() =>
      expect(screen.getByTestId('llm-models-table')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId('llm-models-delete'));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/admin/llm-provider-models/12',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('llm-models-empty')).toBeInTheDocument(),
    );
  });

  it('renders the server error inline when createModel fails', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse([{ id: 1, name: 'openai', url: 'u', api_key: '********', type: 'openai_completions', created_at: 't' }]),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse({ error: 'Provider not found' }, 400),
      );

    renderAt('/admin/llm-provider-models', fetchSpy);

    await waitFor(() =>
      expect(screen.getByTestId('llm-models-create-form')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId('llm-models-create-provider'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('llm-models-create-name'), {
      target: { value: 'gpt-4o' },
    });
    fireEvent.click(screen.getByTestId('llm-models-create-submit'));

    const err = await screen.findByTestId('llm-models-error');
    expect(err).toHaveTextContent('Provider not found');
  });
});
