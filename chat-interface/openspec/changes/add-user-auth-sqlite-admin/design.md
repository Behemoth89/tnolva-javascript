## Context

The chat-interface is a fresh Express + React + TypeScript fullstack with a single
`GET /api/health` endpoint and a `HealthCheck` page. It has no persistence and no
auth. This change introduces the minimum viable identity layer: a SQLite users
table, password-based session auth, an admin role, and the React pages needed to
register, sign in, sign out, and reach an admin-only view.

The current backend already uses `helmet`, `cors`, `express.json()`, and
`morgan` (in `backend/src/app.ts`). CORS is currently configured with
`credentials: false` and a hard-coded origin list — both must change to support
credentialed requests from the Vite dev server and the nginx production origin.

The frontend currently has no router and no state container; the entire app is
the `HealthCheck` component. We will add `react-router-dom` for routing and a
React Context for auth state.

## Goals / Non-Goals

**Goals**

- Persist users in a SQLite file that survives container restarts.
- Provide a simple, conventional auth API: `register`, `login`, `logout`, `me`.
- Use safe, boring defaults: bcrypt, httpOnly + sameSite cookie, helmet, rate
  limiting, server-side validation.
- Bootstrap the first user as admin so the system is usable immediately after
  deployment without manual DB edits.
- Provide enough UI to exercise the API: register, login, logout, route guard,
  admin page listing users.
- Keep all existing tests green and add coverage for the new behavior.

**Non-Goals**

- Email verification, password reset, account recovery flows.
- Multi-factor authentication, OAuth, social login.
- Role hierarchy beyond a binary `is_admin` flag.
- Audit logging, session listing, "log out everywhere".
- Production-grade CSRF tokens (sameSite=lax is the v1 mitigation).
- Per-user rate limiting, captcha, account lockout beyond a simple IP-based
  limiter on `register` and `login`.

## Decisions

### 1. SQLite driver: `better-sqlite3`

**Why:** Synchronous, in-process, zero-network, battle-tested for single-server
apps like this one. Eliminates async-pool complexity, has typed prepared
statements, and is the natural fit for a single-container Express service.

**Alternatives considered:**

- `sqlite3` (async callback API) — adds noise; no benefit at this scale.
- Postgres — overkill for a single-user-at-a-time chat app skeleton and would
  require a second container, migration tooling, and a connection pool.

### 2. Session strategy: `express-session` with `better-sqlite3-session-store`

**Why:** Stays inside the cookie-session pattern the user requested, requires
no JWT signing/rotation logic, and works with a single `httpOnly` cookie. A
SQLite-backed store means sessions survive container restarts alongside the
users table, so a logged-in user is not silently logged out on every deploy.

**Alternatives considered:**

- JWT in httpOnly cookie — adds a revocation problem (no server-side session
  record to invalidate) and complicates logout. Defer until we need stateless
  auth across services.
- In-memory session store — sessions evaporate on restart; bad for a chat app
  where a deploy would kick everyone off mid-conversation.

### 3. Password hashing: `bcrypt` cost 10

**Why:** The user's spec asks for cost ≥ 10. Cost 10 is the standard floor
(~100 ms per hash on commodity hardware) — slow enough to resist brute force,
fast enough not to punish the dev feedback loop.

### 4. First-user-admin bootstrap via count-then-insert

**Why:** The user spec calls for `SELECT COUNT(*) FROM users` before the insert
and setting `is_admin=1` when the count is 0. We do exactly that, wrapped in a
single SQLite transaction (`BEGIN IMMEDIATE; SELECT count; INSERT; COMMIT;`) to
eliminate the race where two simultaneous registrations both see count=0 and
both become admin. The `UNIQUE` constraint on `email` is the second line of
defense.

**Alternative considered:** Insert with `is_admin = (SELECT COUNT(*) = 0 FROM users)` —
works in a single statement but obscures intent and is harder to test in isolation.

### 5. Validation: hand-rolled, no `zod`/`joi`

**Why:** Validation here is two fields (email, password) with trivial rules. A
validator library is dependency weight without payoff. A tiny `validate.ts`
module with one exported `validateRegistration` and one `validateLogin` keeps
the test surface obvious.

### 6. Rate limiting: `express-rate-limit` in-memory

**Why:** Single-process server, dev/simple prod. In-memory store is fine for
the v1; the limiter applies only to `POST /api/auth/register` and
`POST /api/auth/login` (e.g. 10 requests / 15 min per IP).

**Alternative considered:** Persistent store — not worth the complexity yet.

### 7. CSRF: `sameSite=lax` cookie + same-origin requests

**Why:** The Vite dev proxy and the nginx reverse proxy make the frontend
same-origin with the backend, so cross-site form submissions cannot ride a
`POST /api/auth/*` request with the session cookie. Combined with the
`httpOnly` + `secure`-in-prod cookie flags, this is the standard v1 mitigation
for a server-rendered single-page app. We do **not** ship a token-based CSRF
middleware in this change.

### 8. Frontend routing & state: `react-router-dom` v6 + React Context

**Why:** `react-router-dom` is the de-facto router; a single `AuthContext`
suffices for a handful of pages and a couple of actions. No Redux/Zustand
needed — the state surface is `{ user, status, login, register, logout }`.

### 9. Database file location: env-driven `DATABASE_PATH`

- Local dev: `backend/data/chat.db` (gitignored).
- Docker: `/data/chat.db`, with a named volume `chat-data` mounted at `/data`
  in `docker-compose.yml` so the file persists across `docker compose down`.

`backend/src/index.ts` runs `db.init()` (which executes `CREATE TABLE IF NOT
EXISTS users ...`) once on startup before the HTTP server binds, so the
migration step is implicit and idempotent — no separate `migrate` command
needed for v1.

### 10. CORS: enable credentials, reflect origin from env

The `cors()` middleware is reconfigured to read `FRONTEND_ORIGIN` (default
`http://localhost:5173,http://localhost`), set `credentials: true`, and
`origin: true` (reflect the request origin when it matches the allow list).
This is what makes the session cookie survive the dev proxy.

## Risks / Trade-offs

- **[Risk] Concurrent first-user registrations both become admin.**
  → **Mitigation:** wrap count + insert in a single `BEGIN IMMEDIATE`
  transaction; the `UNIQUE(email)` constraint rejects duplicates.
- **[Risk] Plain `sameSite=lax` is not bulletproof CSRF defense.**
  → **Mitigation:** document in `README.md` that a CSRF token middleware is the
  next hardening step; acceptable for the v1 single-origin setup.
- **[Risk] In-memory rate limiter resets on restart, allowing a burst after
  deploy.**
  → **Mitigation:** accept the trade-off for v1; revisit when we add a second
  backend instance.
- **[Risk] SQLite write contention under chat traffic.**
  → **Mitigation:** WAL mode enabled in `db.init()`; users table is small and
  write-light compared to chat history (which is not in scope).
- **[Risk] Dev convenience: registration is open by default.**
  → **Mitigation:** the rate limiter slows scripted abuse; closing
  registration is a one-line config flip that the README documents as the
  production hardening step.
- **[Risk] Password hashes leave the server in test failures.**
  → **Mitigation:** integration tests assert the response body does **not**
  contain `password_hash`; `bcrypt.hash` is never called with the password
  argument logged.

## Migration Plan

There is no existing data, so this is a greenfield deployment. Rollout:

1. Merge the change.
2. Bump the backend image (`docker compose build backend`) and the frontend
   image; `docker compose up -d`.
3. `backend` container runs `db.init()` on start, creating `users` table on
   first boot.
4. Operator opens the app, registers the first account, and is automatically
   admin.

**Rollback:** stop the stack and remove the `chat-data` volume. Because the
users table is the only persisted state, deleting the volume returns the app
to its pre-change state. Sessions in the SQLite session table are cleared
with the same volume.

## Open Questions

- Should `/api/admin/users` return `password_hash` to admins? **Decision
  already taken in this design: no.** The response shape is
  `[{ id, email, is_admin, created_at }]`.
- Should we add a `name` / `display_name` column? **Out of scope for v1**;
  can be added later with a non-destructive migration.
- Should `register` be disabled once any admin exists? **Out of scope for v1**;
  the rate limiter is the v1 mitigation. A future change can introduce an
  `ALLOW_REGISTRATION` env flag.
