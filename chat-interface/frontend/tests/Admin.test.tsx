import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import Admin from '../src/pages/Admin';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Admin page (component)', () => {
  let originalConsoleError: typeof console.error;
  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalConsoleError;
    vi.restoreAllMocks();
  });

  it('admin sees the user list from the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(
        mockJsonResponse({ user: { id: 1, email: 'admin@example.com', is_admin: 1 } }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse([
          { id: 1, email: 'admin@example.com', is_admin: 1 },
          { id: 2, email: 'user2@example.com', is_admin: 0 },
        ]),
      );

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('admin-users-table')).toBeInTheDocument(),
    );
    const rows = screen.getAllByTestId('admin-user-row');
    expect(rows.length).toBe(2);
    expect(rows[0]).toHaveTextContent('admin@example.com');
    expect(rows[0]).toHaveTextContent('admin');
    expect(rows[1]).toHaveTextContent('user2@example.com');
    expect(rows[1]).toHaveTextContent('user');
  });

  it('non-admin sees the denial message and the API is not called', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockResolvedValueOnce(
      mockJsonResponse({ user: { id: 2, email: 'user@example.com', is_admin: 0 } }),
    );

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('admin-denied')).toBeInTheDocument();
    expect(screen.getByTestId('admin-denied-message')).toHaveTextContent(
      /admin privileges required/i,
    );
    expect(screen.queryByTestId('admin-users-table')).not.toBeInTheDocument();
    const adminCall = fetchSpy.mock.calls.find(([url]) => url === '/api/admin/users');
    expect(adminCall).toBeUndefined();
  });
});
