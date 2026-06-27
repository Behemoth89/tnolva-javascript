import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import RouteGuard from '../src/components/RouteGuard';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderRouteGuard({
  initialPath,
  meStatus,
  mePayload,
}: {
  initialPath: string;
  meStatus: number;
  mePayload?: unknown;
}) {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  fetchSpy.mockResolvedValueOnce(mockJsonResponse(mePayload ?? { error: 'Not authenticated' }, meStatus));

  return {
    fetchSpy,
    ...render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div data-testid="login-route">Login</div>} />
            <Route
              path="/protected"
              element={
                <RouteGuard>
                  <div data-testid="protected-child">Secret</div>
                </RouteGuard>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    ),
  };
}

describe('RouteGuard (component)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects unauthenticated visits to /login', async () => {
    renderRouteGuard({ initialPath: '/protected', meStatus: 401 });

    await waitFor(() =>
      expect(screen.getByTestId('login-route')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('protected-child')).not.toBeInTheDocument();
    expect(screen.queryByTestId('route-guard-loading')).not.toBeInTheDocument();
  });

  it('renders the loading indicator for unauthenticated visits while /me is in flight', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    type Resolver = (value: Response | PromiseLike<Response>) => void;
    const resolvers: Resolver[] = [];
    fetchSpy.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve: Resolver) => {
          resolvers.push(resolve);
        }),
    );
    const resolveMe: Resolver = (value) => {
      const r = resolvers[0];
      if (r) r(value);
    };

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div data-testid="login-route">Login</div>} />
            <Route
              path="/protected"
              element={
                <RouteGuard>
                  <div data-testid="protected-child">Secret</div>
                </RouteGuard>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('route-guard-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('login-route')).not.toBeInTheDocument();
    expect(screen.queryByTestId('protected-child')).not.toBeInTheDocument();

    resolveMe(mockJsonResponse({ error: 'Not authenticated' }, 401));

    await waitFor(() =>
      expect(screen.getByTestId('login-route')).toBeInTheDocument(),
    );
  });

  it('renders the child for authenticated visits', async () => {
    renderRouteGuard({
      initialPath: '/protected',
      meStatus: 200,
      mePayload: { user: { id: 1, email: 'a@b.com', is_admin: 1 } },
    });

    expect(await screen.findByTestId('protected-child')).toBeInTheDocument();
    expect(screen.queryByTestId('login-route')).not.toBeInTheDocument();
  });
});
