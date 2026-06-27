## Why

The chat backend needs to talk to LLM services, but today there is no place
to configure those services. Operators cannot register, update, or remove an
LLM provider (or the specific models offered by that provider) without
editing the database directly. We need an admin-managed catalog of providers
and their models so that chat functionality can dispatch requests to a
configured upstream LLM.

## What Changes

- Add a backend `llm_providers` table and admin REST endpoints under
  `/api/admin/llm-providers` for full CRUD. Each row records
  `name`, `url`, `api_key`, and a `type` from a fixed enum
  (`openai_completions` | `openai_responses` | `anthropic`). All endpoints
  are guarded by `requireAdmin`; the `api_key` value is never echoed in API
  responses (read endpoints return a redacted placeholder).
- Add a backend `llm_provider_models` table and admin REST endpoints under
  `/api/admin/llm-provider-models` for full CRUD. Each row records `name`
  and a foreign key `llm_provider_id` linking it to its parent provider
  (one provider → many models). All endpoints are guarded by `requireAdmin`.
- Add frontend admin pages reachable only to admin users: a providers list
  page with create/edit/delete, and a models list page with
  create/edit/delete and a provider selector. The pages use the same
  `RouteGuard` + client-side `is_admin` check pattern as the existing
  `/admin` users page.
- Add navigation entries that appear only for admins linking to the new
  provider/model management pages.

## Capabilities

### New Capabilities

- `llm-provider-admin`: backend admin REST API and SQLite persistence for
  LLM providers and their associated models, including schema, validation,
  authorization, and the api_key redaction rule.
- `llm-provider-frontend`: React admin pages, API client, and navigation
  entries for managing LLM providers and their models.

### Modified Capabilities

- `user-admin`: the existing admin-only `/api/admin/*` surface expands with
  the new `/api/admin/llm-providers` and `/api/admin/llm-provider-models`
  routers. No behavioral change to the existing users endpoint.
- `auth-frontend`: the existing admin nav gains links to the new provider
  and model management pages; the client-side admin guard pattern is
  reused. No change to login/register/logout/me behavior.

## Impact

- **Backend** — new tables (`llm_providers`, `llm_provider_models`) created
  in `backend/src/db.ts`; new repositories under
  `backend/src/admin/llmProvidersRepo.ts` and
  `backend/src/admin/llmProviderModelsRepo.ts`; new routers under
  `backend/src/admin/router.ts`; registration in `backend/src/app.ts`.
  All new endpoints reuse the existing `requireAdmin` middleware and
  reuse the same test infrastructure (Supertest + in-memory SQLite).
- **Frontend** — new API client module `frontend/src/api/llmProviders.ts`;
  new pages `frontend/src/pages/AdminLLMProviders.tsx` and
  `frontend/src/pages/AdminLLMProviderModels.tsx`; route registration in
  `frontend/src/App.tsx`; nav updates in `frontend/src/components/NavBar.tsx`.
- **Tests** — new backend unit tests for both repos and Supertest
  integration tests covering CRUD plus the 401/403/400/404/409 paths; new
  frontend component tests for the two admin pages and the new API client
  functions. The existing `testing-standards` spec already requires both
  suites to pass via `npm test`.
- **Compatibility** — additive change, no breaking modifications to
  existing endpoints, tables, or pages.
