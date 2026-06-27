## Why

The chat-interface currently has no concept of users — anyone hitting the backend gets full
access, the React shell shows a single health-check screen, and there is no way to gate
features for an administrator. Before the application can grow into the planned
multi-user capabilities (projects, file upload, backend config UI, etc.) it needs a
durable identity layer: persistent users, password-based authentication with safe cookie
sessions, an admin role, and the minimum UI to register, sign in, sign out, and reach an
admin-only page.

## What Changes

- Add a SQLite-backed `users` table, created idempotently on backend startup, with
  `email`, `password_hash`, `is_admin`, and `created_at` columns.
- Add backend auth endpoints under `/api/auth`: `POST /register`, `POST /login`,
  `POST /logout`, and `GET /me`, plus `requireAuth` and `requireAdmin` middleware.
- Introduce an admin-only API endpoint under `/api/admin` (list of registered users)
  protected by `requireAdmin`.
- Switch the backend session/auth pattern to express-session with an httpOnly,
  sameSite=lax, secure-when-prod cookie; bcrypt (cost ≥ 10) for password hashing.
- Add server-side input validation, rate limiting on `register` and `login`, and
  helmet/CORS adjustments to allow credentials from the dev and prod frontend origins.
- Add frontend auth context that hydrates from `GET /api/auth/me` on app load, exposes
  the current user (`id`, `email`, `is_admin`), and provides `register`, `login`, and
  `logout` actions.
- Add frontend pages: `/login`, `/register`, and a protected `/admin` page; gate
  non-auth pages behind a route guard that redirects unauthenticated users to
  `/login`; hide the admin link in the nav for non-admin users; add a Logout button.
- Add a `Database` volume mount in `docker-compose.yml` so the SQLite file persists
  across container restarts; document the new env vars in `backend/.env.example`.
- Extend backend and frontend test suites to cover the new behavior (Jest + Supertest
  on the backend, Vitest + React Testing Library on the frontend).

## Capabilities

### New Capabilities

- `user-auth`: Persistent user identity in SQLite plus backend auth API
  (register, login, logout, me) and `requireAuth` / `requireAdmin` middleware.
- `user-admin`: Admin-only API surface (list users) and the admin role flag
  bootstrap rule that grants the first registered user admin privileges.
- `auth-frontend`: React auth context, `/login` and `/register` pages, logout
  control, route guard, and a `/admin` page that lists all registered users.

### Modified Capabilities

_None._ Existing specs (`backend-health-api`, `frontend-health-client`,
`docker-orchestration`, `testing-standards`) keep their current requirements; the new
test cases are additive and stay within the "test suite passes" requirement.

## Impact

- **Backend code**
  - New: `src/db.ts` (SQLite connection + schema bootstrap), `src/auth/*`
    (router, middleware, password hashing, session config).
  - Changed: `src/app.ts` (session + rate limit + json body limit middleware,
    credentialed CORS, mount `/api/auth` and `/api/admin`); `src/config.ts`
    (new env reads: `SESSION_SECRET`, `DATABASE_PATH`, `COOKIE_SECURE`).
  - New deps: `better-sqlite3`, `bcrypt`, `express-session`, `express-rate-limit`,
    `cookie-parser` (if needed), and matching `@types/*` packages.
- **Frontend code**
  - New: `src/auth/AuthContext.tsx`, `src/api/auth.ts`, `src/pages/Login.tsx`,
    `src/pages/Register.tsx`, `src/pages/Admin.tsx`, `src/components/RouteGuard.tsx`,
    `src/components/NavBar.tsx`, plus a lightweight client-side router
    (`react-router-dom`).
  - Changed: `src/App.tsx` (provider + routes), `src/main.tsx` (router mount).
  - New deps: `react-router-dom`.
- **Infra & config**
  - `docker-compose.yml`: add a `chat-data` named volume and mount it into the
    backend at the SQLite file's directory; pass `SESSION_SECRET` via env.
  - `backend/.env.example`: add `SESSION_SECRET`, `DATABASE_PATH`,
    `COOKIE_SECURE`, `FRONTEND_ORIGIN`.
  - `README.md`: document new env vars, the first-user-admin bootstrap rule,
    and the local-dev HTTP note (HTTPS required in production).
- **API surface**
  - Adds `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`,
    `GET /api/auth/me`, `GET /api/admin/users`. All return JSON. No existing
    endpoint contract is changed.
- **Tests**
  - Backend: unit tests for password hashing + admin bootstrap rule, integration
    tests for each new endpoint (success + failure paths) and for `requireAuth` /
    `requireAdmin` rejection.
  - Frontend: component tests for `Login`, `Register`, `AuthContext`, and
    `Admin` page (gated + content rendering), plus a `RouteGuard` redirect test.
