import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function AuthProbe({ testId = 'auth-probe' }: { testId?: string }) {
  const auth = useAuth();
  return (
    <div data-testid={testId}>
      <span data-testid={`${testId}-status`}>{auth.status}</span>
      <span data-testid={`${testId}-email`}>{auth.user?.email ?? ''}</span>
      <button
        type="button"
        data-testid={`${testId}-logout`}
        onClick={() => {
          void auth.logout();
        }}
      >
        Logout
      </button>
      <button
        type="button"
        data-testid={`${testId}-login`}
        onClick={() => {
          void auth.login('a@b.com', 'pwpwpwpw');
        }}
      >
        Login
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AuthProbe />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

import type { MockInstance } from 'vitest';

type FetchSpy = MockInstance<typeof fetch>;

describe('AuthContext (component)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('hydrates the user from a mocked /api/auth/me 200 response', async () => {
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({ user: { id: 7, email: 'hyd@example.com', is_admin: 1 } }),
    );

    renderWithProvider();

    const status = await screen.findByTestId('auth-probe-status');
    await waitFor(() => expect(status).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('auth-probe-email')).toHaveTextContent('hyd@example.com');
    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({}));
  });

  it('transitions to unauthenticated when /api/auth/me returns 401', async () => {
    fetchSpy.mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401));

    renderWithProvider();

    const status = await screen.findByTestId('auth-probe-status');
    await waitFor(() => expect(status).toHaveTextContent('unauthenticated'));
    expect(screen.getByTestId('auth-probe-email')).toHaveTextContent('');
  });

  it('transitions to unauthenticated when /api/auth/me throws', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network down'));

    renderWithProvider();

    const status = await screen.findByTestId('auth-probe-status');
    await waitFor(() => expect(status).toHaveTextContent('unauthenticated'));
  });

  it('logout calls /api/auth/logout and resets state', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        mockJsonResponse({ user: { id: 1, email: 'a@b.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    renderWithProvider();

    const status = await screen.findByTestId('auth-probe-status');
    await waitFor(() => expect(status).toHaveTextContent('authenticated'));

    await act(async () => {
      fireEvent.click(screen.getByTestId('auth-probe-logout'));
    });

    await waitFor(() =>
      expect(screen.getByTestId('auth-probe-status')).toHaveTextContent('unauthenticated'),
    );
    expect(screen.getByTestId('auth-probe-email')).toHaveTextContent('');
    const logoutCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/auth/logout' && (init as RequestInit | undefined)?.method === 'POST',
    );
    expect(logoutCall).toBeDefined();
  });
});
