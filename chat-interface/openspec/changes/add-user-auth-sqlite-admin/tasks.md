# Tasks: add-user-auth-sqlite-admin

## 1. Backend dependencies & config

- [ ] 1.1 Add runtime deps to `backend/package.json`: `better-sqlite3`,
  `bcrypt`, `express-session`, `better-sqlite3-session-store`,
  `express-rate-limit`, plus matching `@types/*` packages for the typed
  ones.
- [ ] 1.2 Extend `backend/src/config.ts` to read `SESSION_SECRET`,
  `DATABASE_PATH` (default `backend/data/chat.db`), `COOKIE_SECURE` (default
  `false`), and `FRONTEND_ORIGIN` (default
  `http://localhost:5173,http://localhost`). Fail fast with a clear error
  if `SESSION_SECRET` is unset in non-test environments.
- [ ] 1.3 Update `backend/.env.example` with the new variables and a comment
  noting that `SESSION_SECRET` must be set in production.

## 2. Backend persistence

- [ ] 2.1 Create `backend/src/db.ts` exporting `initDb(databasePath)` and a
  typed `getDb()`. Inside `initDb`, open the SQLite file, enable WAL mode,
  and run `CREATE TABLE IF NOT EXISTS users (...)` with the columns from
  the `user-auth` spec (lowercase `email` enforced by storing a normalized
  value).
- [ ] 2.2 Add a `users` repository module (`backend/src/auth/usersRepo.ts`)
  with typed functions: `countUsers()`, `findByEmail(email)`,
  `createUser({ email, passwordHash, isAdmin })`, and `listUsers()`. Wrap
  the count + insert used for first-user-admin in a single
  `BEGIN IMMEDIATE` transaction.
- [ ] 2.3 Add `backend/src/auth/passwords.ts` exporting `hashPassword(plain)`
  and `verifyPassword(plain, hash)` using `bcrypt` with cost factor `10`.

## 3. Backend auth router & middleware

- [ ] 3.1 Add `backend/src/auth/validation.ts` with `validateRegistration`
  and `validateLogin` returning `{ ok: true, value }` or
  `{ ok: false, error }` per the spec rules.
- [ ] 3.2 Add `backend/src/auth/middleware.ts` exporting `requireAuth` and
  `requireAdmin` per the `user-auth` spec (401/403 responses, `req.auth`
  augmentation).
- [ ] 3.3 Add `backend/src/auth/router.ts` exposing `POST /register`,
  `POST /login`, `POST /logout`, and `GET /me` per the `user-auth` spec.
  Login and register use `validation`, `passwords`, and `usersRepo`.
- [ ] 3.4 Add `backend/src/admin/router.ts` exposing `GET /users` guarded
  by `requireAdmin`, returning the list shape from the `user-admin` spec.
- [ ] 3.5 Add `backend/src/auth/rateLimit.ts` exporting an
  `authRateLimiter` middleware (10 req / 15 min / IP) and apply it to
  register and login only.

## 4. Backend app wiring

- [ ] 4.1 Update `backend/src/app.ts`: reconfigure `cors` to support
  credentials and reflect the `FRONTEND_ORIGIN` allow list, add
  `express-session` with a SQLite-backed store, set `cookie.secure`
  from `config.cookieSecure`, mount `/api/auth` and `/api/admin`, and
  apply `authRateLimiter` to the two POST routes.
- [ ] 4.2 Update `backend/src/index.ts` to call `initDb(config.databasePath)`
  before `app.listen`, logging a one-line confirmation (no secrets, no
  user data).
- [ ] 4.3 Add `backend/data` to `.gitignore` (or extend the existing
  backend `.gitignore`) so the SQLite file is not committed.

## 5. Frontend dependencies & API client

- [ ] 5.1 Add `react-router-dom` to `frontend/package.json` dependencies.
- [ ] 5.2 Create `frontend/src/api/auth.ts` exporting `fetchMe`,
  `register`, `login`, `logout`, and `listUsers` (the last used by the
  admin page). All calls use `credentials: "include"` and parse the
  `user` envelope.

## 6. Frontend auth state & routing

- [ ] 6.1 Create `frontend/src/auth/AuthContext.tsx` with the shape from
  the `auth-frontend` spec: `user`, `status`, `login`, `register`,
  `logout`. On mount it issues one `fetchMe()` call.
- [ ] 6.2 Create `frontend/src/components/RouteGuard.tsx` that reads
  `AuthContext`, shows a loading indicator while `status === "loading"`,
  redirects to `/login` when `"unauthenticated"`, and renders children
  when `"authenticated"`.
- [ ] 6.3 Create `frontend/src/components/NavBar.tsx` rendering the app
  title, the Admin link only when `user.is_admin === 1`, and a Logout
  button only when authenticated.
- [ ] 6.4 Create `frontend/src/pages/Login.tsx` with the form behavior
  from the spec (disabled-while-pending, inline error, link to
  `/register`).
- [ ] 6.5 Create `frontend/src/pages/Register.tsx` with the form behavior
  from the spec (confirm-password match, min-length, inline errors).
- [ ] 6.6 Create `frontend/src/pages/Admin.tsx` that calls `listUsers` and
  renders the table; shows "Admin privileges required" if
  `user.is_admin !== 1`. The page does not render the list (and does
  not call the API) for non-admins.
- [ ] 6.7 Refactor `frontend/src/App.tsx` to wrap the app in
  `AuthProvider`, mount `BrowserRouter`, render `NavBar`, and define
  routes: `/login`, `/register` (public), `/` (protected, currently
  shows the existing `HealthCheck`), `/admin` (protected + admin-gated).

## 7. Infrastructure

- [ ] 7.1 Add a named volume `chat-data` in `docker-compose.yml` and mount
  it to `/data` in the `backend` service. Set `DATABASE_PATH=/data/chat.db`
  and a non-empty `SESSION_SECRET` in the backend service `environment`
  block.
- [ ] 7.2 Add a "Production HTTPS required" note to `README.md` and a
  short "Auth quick start" section covering env vars, the first-user-is-admin
  rule, and the fact that local dev runs over HTTP (no `Secure` cookie).
- [ ] 7.3 Update `backend/.dockerignore` and `frontend/.dockerignore` if
  needed to ensure the new source files are copied in but the local
  `data/` directory is excluded.

## 8. Backend tests

- [ ] 8.1 Unit test `passwords.ts` covering: hash differs from plaintext,
  `verifyPassword` returns true for the correct password, false for a
  wrong password, and the bcrypt cost is at least 10 (assert hash length
  or use a known-good hash with the expected cost prefix).
- [ ] 8.2 Unit test the first-user-admin rule in `usersRepo`: with an
  empty DB, `createUser` returns `isAdmin: true`; with one existing user,
  a second `createUser` returns `isAdmin: false`.
- [ ] 8.3 Integration tests under `backend/tests/integration/` (Jest +
  Supertest) covering, in order:
  - `POST /api/auth/register` happy path → 201, body shape, session
    cookie set, response has no `password_hash`.
  - `POST /api/auth/register` duplicate email → 409, no second row.
  - `POST /api/auth/register` malformed email → 400.
  - `POST /api/auth/register` short password → 400.
  - `POST /api/auth/login` happy path → 200, session cookie set.
  - `POST /api/auth/login` wrong password → 401 with the generic message.
  - `POST /api/auth/login` unknown email → 401 with the identical
    generic message.
  - `POST /api/auth/logout` → 204, subsequent `GET /me` → 401.
  - `GET /api/auth/me` anonymous → 401; authenticated → 200 with user
    shape and no `password_hash`.
  - `requireAuth`-guarded route: anonymous → 401; authenticated → handler
    runs and `req.auth.userId` is set.
  - `requireAdmin`-guarded route: anonymous → 401; non-admin → 403;
    admin → 200.
  - `GET /api/admin/users` as admin → 200, array shape, ordered by
    `created_at` ascending, no `password_hash`; as non-admin → 403.
- [ ] 8.4 Verify all backend tests pass with `cd backend && npm test`.

## 9. Frontend tests

- [ ] 9.1 Component test for `Login`: submitting valid credentials via a
  mocked `fetch` navigates to `/` and the auth context transitions to
  authenticated; submitting invalid credentials shows the inline error
  and does not navigate; the submit button is disabled while pending.
- [ ] 9.2 Component test for `Register`: mismatched confirm-password
  blocks the API call and shows the inline error; short password blocks
  the API call; valid submission navigates to `/`; server error is
  rendered inline.
- [ ] 9.3 Component test for `AuthContext`: hydrates user from a mocked
  `/api/auth/me` 200; sets `status` to unauthenticated on 401; `logout`
  calls `/api/auth/logout` and resets state.
- [ ] 9.4 Component test for `Admin`: admin sees the user list from a
  mocked `listUsers` response; non-admin sees the "Admin privileges
  required" message and the API is not called.
- [ ] 9.5 Component test for `RouteGuard`: unauthenticated visits to a
  protected route navigate to `/login`; `loading` state shows the
  indicator without redirecting; authenticated visits render the child.
- [ ] 9.6 Verify all frontend tests pass with `cd frontend && npm run test:run`.
