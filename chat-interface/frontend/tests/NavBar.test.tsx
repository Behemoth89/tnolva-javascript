import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import NavBar from '../src/components/NavBar';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type FetchSpy = MockInstance<typeof fetch>;

function renderNav() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<NavBar />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('NavBar admin links (component)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('admin sees the new admin nav links', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
    );

    renderNav();

    await waitFor(() =>
      expect(screen.getByTestId('nav-llm-providers-link')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('nav-llm-provider-models-link')).toBeInTheDocument();
    expect(screen.getByTestId('nav-llm-providers-link')).toHaveAttribute(
      'href',
      '/admin/llm-providers',
    );
    expect(screen.getByTestId('nav-llm-provider-models-link')).toHaveAttribute(
      'href',
      '/admin/llm-provider-models',
    );
  });

  it('non-admin does not see the new admin nav links', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ user: { id: 2, email: 'user@example.com', is_admin: 0 } }),
    );

    renderNav();

    await waitFor(() =>
      expect(screen.getByTestId('nav-chat-link')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('nav-llm-providers-link')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-llm-provider-models-link')).not.toBeInTheDocument();
  });
});
