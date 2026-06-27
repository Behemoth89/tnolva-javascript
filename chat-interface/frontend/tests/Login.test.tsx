import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../src/pages/Login';
import { AuthProvider } from '../src/auth/AuthContext';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderLogin(initialEntries: string[] = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

import type { MockInstance } from 'vitest';

type FetchSpy = MockInstance<typeof fetch>;

describe('Login page (component)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('submits valid credentials, calls /api/auth/login, and navigates to /', async () => {
    fetchSpy
      .mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401))
      .mockResolvedValueOnce(
        mockJsonResponse({ user: { id: 1, email: 'alice@example.com', is_admin: 1 } }),
      );

    renderLogin();

    fireEvent.change(screen.getByTestId('login-email'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByTestId('login-password'), {
      target: { value: 'correcthorse' },
    });
    fireEvent.click(screen.getByTestId('login-submit'));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ email: 'alice@example.com', password: 'correcthorse' }),
        }),
      ),
    );
    expect(await screen.findByTestId('home-page')).toBeInTheDocument();
  });

  it('shows the inline error and does not navigate on invalid credentials', async () => {
    fetchSpy
      .mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401))
      .mockResolvedValueOnce(mockJsonResponse({ error: 'Invalid email or password' }, 401));

    renderLogin();

    fireEvent.change(screen.getByTestId('login-email'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByTestId('login-password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByTestId('login-submit'));

    const err = await screen.findByTestId('login-error');
    expect(err).toHaveTextContent('Invalid email or password');
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('disables the submit button while the login request is pending', async () => {
    fetchSpy.mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401));
    let resolveLogin: ((value: Response) => void) | null = null;
    fetchSpy.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveLogin = resolve;
        }),
    );

    renderLogin();

    fireEvent.change(screen.getByTestId('login-email'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByTestId('login-password'), {
      target: { value: 'correcthorse' },
    });

    fireEvent.click(screen.getByTestId('login-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('login-submit')).toBeDisabled(),
    );

    expect(resolveLogin).not.toBeNull();
  });

  it('links to /register', () => {
    fetchSpy.mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401));
    renderLogin();
    const link = screen.getByTestId('login-register-link');
    expect(link).toHaveAttribute('href', '/register');
  });
});
