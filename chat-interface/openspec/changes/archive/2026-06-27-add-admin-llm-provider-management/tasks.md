## 1. Backend schema and repositories

- [x] 1.1 Add `CREATE TABLE IF NOT EXISTS llm_providers (...)` and `CREATE TABLE IF NOT EXISTS llm_provider_models (...)` to `backend/src/db.ts` `initDb` with the columns, foreign key, cascade, and unique constraints from `llm-provider-admin` spec.
- [x] 1.2 Create `backend/src/admin/llmProvidersRepo.ts` with types `LLMProviderRow`, `PublicLLMProvider`, `CreateProviderInput`, `UpdateProviderInput` and functions: `listProviders`, `getProviderById`, `createProvider`, `updateProvider`, `deleteProvider`. `toPublic` mapper returns `api_key: "********"`.
- [x] 1.3 Create `backend/src/admin/llmProviderModelsRepo.ts` with types `LLMProviderModelRow`, `PublicLLMProviderModel`, `CreateModelInput`, `UpdateModelInput` and functions: `listModels(providerId?)`, `getModelById`, `createModel`, `updateModel`, `deleteModel`. `createModel` and `updateModel` validate the referenced `llm_provider_id` exists.
- [x] 1.4 Map `SQLITE_CONSTRAINT_UNIQUE` (and `SQLITE_CONSTRAINT_FOREIGNKEY`) to typed `Conflict` / `NotFound` / `Validation` results the routers can convert to 409/404/400.

## 2. Backend validation and routes

- [x] 2.1 Create `backend/src/admin/validation.ts` exporting `parseProviderBody(body, { partial?: boolean })` and `parseModelBody(body, { partial?: boolean })` returning either the typed value or `{ error: string }`. Enforce the field rules from `llm-provider-admin` spec.
- [x] 2.2 Create `backend/src/admin/llmProvidersRouter.ts` with the five endpoints, all chained with `requireAuth, requireAdmin`. On validation error return `400`; on conflict return `409`; on missing row return `404`. On success return `200`/`201`/`204` per the spec.
- [x] 2.3 Create `backend/src/admin/llmProviderModelsRouter.ts` with the five endpoints plus `?provider_id=` filter on list. Same error mapping.
- [x] 2.4 Mount both routers in `backend/src/admin/router.ts` under `/llm-providers` and `/llm-provider-models`; verify `backend/src/app.ts` still mounts `adminRouter` under `/api/admin`.

## 3. Backend tests

- [x] 3.1 Add unit tests in `backend/tests/unit/llmProvidersRepo.test.ts` covering: create + list, get-by-id, update, delete, duplicate name → conflict, missing id → null, cascade delete of models when provider removed.
- [x] 3.2 Add unit tests in `backend/tests/unit/llmProviderModelsRepo.test.ts` covering: create + list, list filtered by provider, update, delete, duplicate name on same provider → conflict, same name on different providers → ok, missing `llm_provider_id` → validation, nonexistent `llm_provider_id` → validation.
- [x] 3.3 Add Supertest integration tests in `backend/tests/integration/admin.llmProviders.api.test.ts` covering the full HTTP surface: list/get/create/update/delete on `/api/admin/llm-providers`, the 401 (anonymous), 403 (non-admin), 400 (bad type/length/missing field), 404 (missing id), 409 (duplicate name) paths, and assert the `api_key` is redacted/omitted in all responses.
- [x] 3.4 Add Supertest integration tests in `backend/tests/integration/admin.llmProviderModels.api.test.ts` mirroring the providers suite for `/api/admin/llm-provider-models` plus the `?provider_id=` filter.
- [x] 3.5 Run `cd backend && npm test` and confirm exit 0.

## 4. Frontend API client and types

- [x] 4.1 Create `frontend/src/api/llmProviders.ts` exporting the types `LLMProviderType = 'openai_completions' | 'openai_responses' | 'anthropic'`, `LLMProvider`, `LLMProviderModel`, and the ten functions listed in `llm-provider-frontend` spec. Reuse the `request<T>()` / `parseError` pattern from `frontend/src/api/auth.ts`. All `fetch` calls use `credentials: 'include'`.
- [x] 4.2 Add a Vitest unit test `frontend/src/api/llmProviders.test.ts` mocking `global.fetch` and asserting: each function calls the right URL/method/headers, returns parsed JSON on 2xx, rejects with the server `error` message on non-2xx (and a generic message when the body has no `error` field).

## 5. Frontend admin pages and nav

- [x] 5.1 Create `frontend/src/pages/AdminLLMProviders.tsx` mirroring the structure of `pages/Admin.tsx`: `useAuth` to check `is_admin`, render the denial section when not admin, otherwise fetch `listProviders`, render the table, and provide a create form (`name`, `url`, `api_key`, `type` select), per-row edit form (allow blank `api_key` to mean "keep"), per-row delete action. Disable submit while a request is in flight; show server `error.message` inline on rejection.
- [x] 5.2 Add `frontend/src/pages/AdminLLMProviders.module.css` for layout consistent with the existing `Admin.module.css` (page, title, subtitle, table, error, loading).
- [x] 5.3 Create `frontend/src/pages/AdminLLMProviderModels.tsx` mirroring the same pattern: denial view, then on mount fetch `listProviders()` and `listModels()` in parallel, render a table with a Provider column, expose a provider selector that switches between `listModels()` and `listModels(providerId)`, and provide a create form (`provider` select + `name` input), per-row edit form, per-row delete action.
- [x] 5.4 Add `frontend/src/pages/AdminLLMProviderModels.module.css`.
- [x] 5.5 Register the two new routes in `frontend/src/App.tsx` under `/admin/llm-providers` and `/admin/llm-provider-models`, each wrapped in `RouteGuard`.
- [x] 5.6 Update `frontend/src/components/NavBar.tsx` to render two new `<NavLink>` entries (to `/admin/llm-providers` and `/admin/llm-provider-models`) gated on `user?.is_admin === 1`, matching the existing admin link's styling.

## 6. Frontend tests

- [x] 6.1 Add a Vitest test for `AdminLLMProviders.tsx` asserting: admin sees the providers table after `listProviders` resolves, non-admin sees the denial and no API call is made, submitting the create form calls `createProvider` and refreshes the list, clicking delete calls `deleteProvider` and refreshes, server error renders inline.
- [x] 6.2 Add a Vitest test for `AdminLLMProviderModels.tsx` asserting: admin sees the models table with provider names, non-admin sees the denial, selecting a provider triggers `listModels(providerId)`, submitting the create form calls `createModel` and refreshes, clicking delete calls `deleteModel` and refreshes, server error renders inline.
- [x] 6.3 Add a Vitest test for `NavBar.tsx` (or extend an existing one) asserting: when `user.is_admin === 1` the nav contains links to both new routes, when `user.is_admin === 0` it does not.
- [x] 6.4 Run `cd frontend && npm test` and confirm exit 0.

## 7. Final verification

- [x] 7.1 Run `cd backend && npm run lint && npx tsc --noEmit` (or the project's equivalent) and confirm no new errors. (No `lint` script; `npx tsc --noEmit` passes.)
- [x] 7.2 Run `cd frontend && npm run lint && npx tsc --noEmit` (or the project's equivalent) and confirm no new errors. (No `lint` script; `npx tsc -b` passes.)
- [x] 7.3 Run `openspec verify add-admin-llm-provider-management` and address any BLOCK findings. (`openspec verify` is not a command in this CLI version; the spec scenarios are covered by the 73 backend + 57 frontend tests, all green.)
