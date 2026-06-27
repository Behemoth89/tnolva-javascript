## Context

The chat-interface repo (`C:\Kool\tnolva-javascript\chat-interface`) is a
Node/Express + React + SQLite full-stack app shipped via Docker. Today
the admin surface is limited to `GET /api/admin/users` (backed by
`backend/src/admin/router.ts`) and the React page at `/admin`
(`frontend/src/pages/Admin.tsx`). The auth model is already in place:
`requireAuth` and `requireAdmin` middleware, the `AuthContext`, and the
`RouteGuard` + client-side `is_admin` check pattern.

LLM dispatch does not exist yet. The first step is to let an
operator configure providers and the models they expose via a
catalog persisted in SQLite and managed through admin pages. This
change introduces the configuration surface only — request-time LLM
dispatch is out of scope.

## Goals / Non-Goals

**Goals:**

- Persist LLM providers and their models in SQLite with referential
  integrity (provider → models, cascade delete).
- Expose full CRUD for both resources under `/api/admin/llm-providers`
  and `/api/admin/llm-provider-models`, guarded by `requireAdmin`.
- Redact `api_key` from every API response that returns a provider
  row, so a logged-in admin client never receives the plaintext secret
  after the initial create.
- Provide React admin pages with create / edit / delete, plus admin-only
  nav entries that mirror the existing `/admin` UX.
- Cover the new behavior with unit + Supertest integration tests on
  the backend and Vitest component / API tests on the frontend, and
  keep both `npm test` suites green.

**Non-Goals:**

- Outbound HTTP calls to upstream LLM providers (request-time
  dispatch).
- Encryption-at-rest for `api_key` beyond filesystem permissions (the
  secret is stored in plain text in the SQLite file as part of the
  provider row; defense-in-depth encryption is a separate concern).
- Provider-level secrets rotation, audit logging, or rate limiting.
- Multi-tenant scoping (all providers are global, gated only by admin
  role).
- Pagination — for v1, lists return all rows.

## Decisions

### Decision: Co-locate new routes under the existing admin router

The current `backend/src/admin/router.ts` exposes `GET /admin/users`.
We add two new sub-routers in the same directory:
`backend/src/admin/llmProvidersRouter.ts` and
`backend/src/admin/llmProviderModelsRouter.ts`. They are mounted from
`backend/src/admin/router.ts` under `/llm-providers` and
`/llm-provider-models` respectively, so the URL surface
(`/api/admin/llm-providers/...`, `/api/admin/llm-provider-models/...`)
is grouped with the rest of the admin API and the same `requireAuth`
+ `requireAdmin` chain is applied in one place.

**Alternatives considered:**

- *Add the routes directly inside `admin/router.ts`.* Rejected because
  the file would grow and would mix three distinct resources' CRUD.
- *Mount at the top level (`/api/llm-providers`).* Rejected because
  authorization is the defining characteristic of the admin API and
  grouping by URL prefix makes the security boundary obvious.

### Decision: Two separate tables, foreign key with ON DELETE CASCADE

`llm_providers` and `llm_provider_models` are separate tables. The
model table has `llm_provider_id INTEGER NOT NULL REFERENCES
llm_providers(id) ON DELETE CASCADE` so deleting a provider removes
its models in a single statement, keeping the catalog consistent
without a service-layer sweep. The unique constraint is
`(llm_provider_id, name)`, allowing the same model name to exist on
different providers (e.g. both OpenAI and a self-hosted proxy may
expose `gpt-4o`).

**Alternatives considered:**

- *JSON column on `llm_providers` storing the model list.* Rejected
  because operators want to add/remove models independently and the
  spec calls out CRUD per resource.
- *Soft-delete with a `deleted_at` column.* Rejected as out of scope
  for v1; cascading hard delete matches the simplicity of the rest
  of the admin surface.

### Decision: DDL is colocated in `initDb` alongside the users DDL

The new `CREATE TABLE IF NOT EXISTS` statements are added to
`backend/src/db.ts`'s `initDb` function, following the same
idempotent pattern already used for `users`. SQLite's `foreign_keys`
pragma is already set to `ON` in `initDb`, so `ON DELETE CASCADE` is
honored. Schema is intentionally narrow: only the four columns
defined in the spec, plus a `created_at` and the foreign key.

### Decision: `api_key` redaction strategy

Repos return `api_key` as the literal string `"********"` for GET
list and GET-by-id. POST and PUT responses omit the `api_key` field
entirely. This is implemented in the repo's `toPublic` mapper
(distinct from `usersRepo.toPublic`) and means the controller layer
does not need a separate "redact on read" branch. Updates accept an
omitted `api_key` (PUT body) and preserve the existing secret in
that case, which matches the spec's edit-form behavior.

**Alternatives considered:**

- *Send `api_key` once on create, never again, with a separate
  reveal endpoint.* Rejected for v1: the spec mandates redaction
  "in any response body" without a reveal endpoint, and we want to
  ship the minimal surface that satisfies the spec.
- *Hash `api_key` like a password.* Rejected: the backend needs the
  plaintext to call the upstream provider at request time (future),
  and we cannot reconstruct it from a hash.

### Decision: New validation module under `backend/src/admin/`

A small `validation.ts` colocated with the admin module exports
`parseProviderBody` and `parseModelBody`. These are pure functions
that return either a typed value or an `{ error }` object, so the
router handlers stay thin and testable. Validation enforces:

- `name` 1..128 chars
- `url` 1..512 chars
- `api_key` (POST) 1..512 chars; (PUT) 0..512 chars, empty/missing
  means "keep existing"
- `type` ∈ `{ openai_completions, openai_responses, anthropic }`
- `llm_provider_id` (model) is a positive integer and refers to an
  existing provider (checked via a repo lookup)

**Alternatives considered:**

- *Use a schema library (zod, joi).* Rejected: the project does not
  currently use one and adding it for this change would be a
  one-off dependency. Plain hand-written checks are sufficient and
  match the style of `backend/src/auth/validation.ts`.

### Decision: Frontend mirrors the backend API surface

`frontend/src/api/llmProviders.ts` exports one function per endpoint,
following the same `request<T>()` / `parseError` pattern as
`frontend/src/api/auth.ts`. Types (`LLMProvider`, `LLMProviderType`,
`LLMProviderModel`) are exported alongside the functions so pages
and tests can import them. No caching layer is added in v1 — pages
refetch after every mutation.

### Decision: Reuse the `RouteGuard` + `is_admin` denial pattern

The two new pages (`AdminLLMProviders.tsx`, `AdminLLMProviderModels.tsx`)
follow the structure of the existing `pages/Admin.tsx`: `useAuth()`
to read `user.is_admin`, return the denial section when not admin,
otherwise fetch + render. The forms live inline in each page (no
extracted sub-components) to match the existing style. Vitest tests
render the pages with a mocked `AuthContext` and a mocked fetch.

**Alternatives considered:**

- *Extract a shared `AdminListPage` component.* Rejected: the two
  resources have different fields, validation, and provider
  selectors. Premature abstraction would cost more than it saves at
  two pages.

### Decision: Nav updates live in `components/NavBar.tsx`

Two new `<NavLink>` entries appear alongside the existing `/admin`
link, gated on `user?.is_admin === 1`. No new auth, route, or context
changes are needed — the existing `NavBar` already conditionally
renders the admin link.

## Risks / Trade-offs

- **[Plaintext `api_key` in SQLite]** → Mitigation: file permissions
  on `backend/data/chat.db` follow the existing model (container
  filesystem, no network exposure). Encryption-at-rest is logged as
  a follow-up.
- **[Cascade delete is destructive]** → Mitigation: the delete
  endpoint is gated by `requireAdmin`; the UI presents an explicit
  "Delete" action and the spec surfaces a 204 on success. No undo
  flow is provided in v1.
- **[Single SQL transaction for cascade]** → SQLite's `ON DELETE
  CASCADE` is honored because `foreign_keys = ON` is set in
  `initDb`. If a future migration disables that pragma, the cascade
  will silently no-op — covered by an integration test that deletes
  a provider and asserts the models are gone.
- **[No pagination]** → Fine for v1 catalog sizes; revisit if the
  table grows.
- **[Provider `type` is freeform enum]** → Adding a new provider
  type later requires a code change. Acceptable for v1; the
  validation is centralized so the change is small.

## Migration Plan

The change is purely additive:

1. Deploy the backend with the new tables and routers mounted.
   `CREATE TABLE IF NOT EXISTS` is idempotent, so an existing
   database is upgraded in place on first request. No data migration
   is needed.
2. Deploy the frontend with the new pages and nav links. Existing
   admin pages (`/admin`) keep working unchanged.
3. Rollback: redeploy the previous backend image (the new tables
   remain but are unreferenced; admins cannot see them in the
   previous UI). If desired, drop the tables manually:
   `DROP TABLE llm_provider_models; DROP TABLE llm_providers;`.

## Open Questions

- None blocking. Two follow-ups to consider after this change lands:
  encrypt `api_key` at rest, and add pagination to the list
  endpoints.
