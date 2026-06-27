import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Register from '../src/pages/Register';
import { AuthProvider } from '../src/auth/AuthContext';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderRegister(initialEntries: string[] = ['/register']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

import type { MockInstance } from 'vitest';

type FetchSpy = MockInstance<typeof fetch>;

describe('Register page (component)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('blocks the API call and shows an inline error when passwords do not match', async () => {
    fetchSpy.mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401));
    renderRegister();

    fireEvent.change(screen.getByTestId('register-email'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByTestId('register-password'), {
      target: { value: 'abcdefgh' },
    });
    fireEvent.change(screen.getByTestId('register-confirm'), {
      target: { value: 'abcd1234' },
    });
    fireEvent.click(screen.getByTestId('register-submit'));

    const err = await screen.findByTestId('register-error');
    expect(err).toHaveTextContent(/match/i);
    const registerCall = fetchSpy.mock.calls.find(([url]) => url === '/api/auth/register');
    expect(registerCall).toBeUndefined();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('blocks the API call and shows an inline error when password is too short', async () => {
    fetchSpy.mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401));
    renderRegister();

    fireEvent.change(screen.getByTestId('register-email'), {
      target: { value: 'short@example.com' },
    });
    fireEvent.change(screen.getByTestId('register-password'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByTestId('register-confirm'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByTestId('register-submit'));

    const err = await screen.findByTestId('register-error');
    expect(err).toHaveTextContent(/at least/i);
    const registerCall = fetchSpy.mock.calls.find(([url]) => url === '/api/auth/register');
    expect(registerCall).toBeUndefined();
  });

  it('submits valid registration, calls /api/auth/register, and navigates to /', async () => {
    fetchSpy
      .mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401))
      .mockResolvedValueOnce(
        mockJsonResponse({ user: { id: 1, email: 'alice@example.com', is_admin: 1 } }),
      );

    renderRegister();

    fireEvent.change(screen.getByTestId('register-email'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByTestId('register-password'), {
      target: { value: 'correcthorse' },
    });
    fireEvent.change(screen.getByTestId('register-confirm'), {
      target: { value: 'correcthorse' },
    });
    fireEvent.click(screen.getByTestId('register-submit'));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(await screen.findByTestId('home-page')).toBeInTheDocument();
  });

  it('renders a server error inline when registration fails', async () => {
    fetchSpy
      .mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401))
      .mockResolvedValueOnce(
        mockJsonResponse({ error: 'Email is already registered' }, 409),
      );

    renderRegister();

    fireEvent.change(screen.getByTestId('register-email'), {
      target: { value: 'taken@example.com' },
    });
    fireEvent.change(screen.getByTestId('register-password'), {
      target: { value: 'correcthorse' },
    });
    fireEvent.change(screen.getByTestId('register-confirm'), {
      target: { value: 'correcthorse' },
    });
    fireEvent.click(screen.getByTestId('register-submit'));

    const err = await screen.findByTestId('register-error');
    expect(err).toHaveTextContent('Email is already registered');
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('links to /login', () => {
    fetchSpy.mockResolvedValueOnce(mockJsonResponse({ error: 'Not authenticated' }, 401));
    renderRegister();
    const link = screen.getByTestId('register-login-link');
    expect(link).toHaveAttribute('href', '/login');
  });
});
