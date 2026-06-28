## 1. Backend schema (project + chat wiring)

- [ ] 1.1 Add `project_templates` and `projects` `CREATE TABLE IF NOT EXISTS` statements to `backend/src/db.ts` `initDb`, with the indexes from `project-api` (incl. the partial unique indexes for `is_default` and `is_user_default`).
- [ ] 1.2 Add the `chats.project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE` column to the `chats` schema; add the `idx_chats_project_id` index.
- [ ] 1.3 Implement the backfill migration in `db.ts` `initDb`: detect the `chats.project_id` column missing, then in a single transaction (a) lazily seed one `projects` row per user (using the current `is_default` template or the system fallback) with `is_user_default = 1`, (b) `UPDATE chats SET project_id = (SELECT id FROM projects WHERE projects.user_id = chats.user_id AND projects.is_user_default = 1) WHERE project_id IS NULL`, then (c) rebuild the `chats` table with `project_id NOT NULL` (SQLite cannot add `NOT NULL` in place).
- [ ] 1.4 Re-assert foreign-key integrity at the end of the migration with `PRAGMA foreign_key_check` and log a fatal error on any violation.

## 2. Backend projects module (user)

- [ ] 2.1 Create `backend/src/projects/projectsRepo.ts` exporting the SQL helpers (`listProjectsForUser`, `getProjectForUser`, `getDefaultProjectForUser`, `insertProject`, `updateProject`, `setUserDefaultProject`, `deleteProject`) using parameterised statements and scoped-by-`user_id` queries.
- [ ] 2.2 Create `backend/src/projects/validation.ts` mirroring the validation style in `chats/validation.ts`: trim/required checks for `name` (1–80 chars), required `default_llm_provider_model` with the same catalog lookup as the chats module, and the `is_user_default` invariant for `makeDefaultProject`.
- [ ] 2.3 Create `backend/src/projects/projectsService.ts` exporting the lazy-seed helper: `ensureDefaultProject(userId)` materialises the user-default project from the current default template (or the system fallback) using a `BEGIN IMMEDIATE` transaction guarded by a `SELECT ... WHERE user_id = ? AND is_user_default = 1` check; on no row it inserts one and returns it.
- [ ] 2.4 Create `backend/src/projects/projectsRouter.ts` exposing `GET /api/projects`, `GET /api/projects/default`, `GET /api/projects/:id`, `POST /api/projects`, `PATCH /api/projects/:id`, `POST /api/projects/:id/make-default`, `DELETE /api/projects/:id`. Guard every handler with `requireAuth`. The list / get / `default` handlers call `ensureDefaultProject` first; the `delete` handler returns 409 when `is_user_default = 1`.
- [ ] 2.5 Wire the new router into `backend/src/app.ts` under `/api/projects`.

## 3. Backend project templates module (admin)

- [ ] 3.1 Create `backend/src/admin/projectTemplatesRepo.ts` exporting `listProjectTemplates`, `getProjectTemplate`, `insertProjectTemplate`, `updateProjectTemplate`, `deleteProjectTemplate`. The insert/update helpers run inside a transaction that first clears the existing default when the new value is `is_default = 1`.
- [ ] 3.2 Create `backend/src/admin/projectTemplatesRouter.ts` exposing `GET`, `POST`, `PATCH`, `DELETE /api/admin/project-templates/:id`. Guard every handler with `requireAuth` + `requireAdmin`. Return 404 on unknown id; 204 on delete; respect the catalog check for `default_llm_provider_model`.
- [ ] 3.3 Wire the new admin router into `backend/src/app.ts` under `/api/admin/project-templates` and append it to the existing admin router aggregator.

## 4. Backend chat wiring (project context)

- [ ] 4.1 Update `backend/src/chats/chatsRepo.ts` so the `chats` SELECT statements `LEFT JOIN projects ON projects.id = chats.project_id` and return `project_id` and `project_name` on every chat row, and so the `INSERT` accepts a `project_id` column.
- [ ] 4.2 Update `backend/src/chats/validation.ts` so the `POST /api/chats` body schema accepts an optional `project_id` (number); when present, the validation layer emits a `project_owner_check` step that the router uses to confirm the project is owned by the authenticated user.
- [ ] 4.3 Update `backend/src/chats/chatsRouter.ts` `POST /api/chats` handler: when `project_id` is omitted, call `ensureDefaultProject(req.auth.userId)` and use the returned `id`; when `project_id` is present, look it up scoped to the user (404 on miss).
- [ ] 4.4 Update `backend/src/chats/chatService.ts` `sendMessage` flow: after loading the chat, `LEFT JOIN projects` to read `system_prompt` and pass it as the `LlmRequest.system` field on dispatch. `system_prompt` MAY be `null`; pass it through as `null` to `LlmRequest` in that case.

## 5. Backend tests

- [ ] 5.1 Add a unit test for `ensureDefaultProject` covering: (a) first call materialises one project, (b) second call returns the same project, (c) two concurrent calls produce one project.
- [ ] 5.2 Add a unit test for the admin template transaction: creating a default template clears the previous default; updating a non-default to default clears the previous default.
- [ ] 5.3 Add a unit test for `POST /api/chats` with and without `project_id` covering: omitted → user default, owned by caller → persists, owned by another user → 404, no body → 400.
- [ ] 5.4 Add a unit test for `sendMessage` confirming the project's `system_prompt` is passed to `LlmRequest.system` (use a stub `LlmClient`).
- [ ] 5.5 Add a migration test: starting against a pre-feature SQLite file (no `projects`, no `chats.project_id`) results in every existing chat belonging to a project and the `chats.project_id` column being `NOT NULL` after the first startup.

## 6. Frontend projects API client

- [ ] 6.1 Create `frontend/src/api/projects.ts` exporting the `Project` and `ProjectTemplate` types plus the functions listed in `project-frontend`'s "projects API client mirrors the backend REST surface" requirement. All `fetch` calls SHALL use `credentials: "include"`. Reuse the same error-message-derivation pattern from `frontend/src/api/chats.ts` and `frontend/src/api/llmProviders.ts`.
- [ ] 6.2 Add `project_id: number` and `project_name: string` to the `Chat` type in `frontend/src/api/chats.ts`; update the `createChat` signature to accept an optional `project_id`.

## 7. Frontend Projects page

- [ ] 7.1 Create `frontend/src/pages/Projects.tsx` (and matching `Projects.module.css`) rendering the list / create / rename / delete / set-default UI per `project-frontend`'s "Projects page lists, creates, renames, deletes, sets default" requirement.
- [ ] 7.2 Add the `/projects` route in `frontend/src/App.tsx`, wrapped in `RouteGuard`.
- [ ] 7.3 Add the "Projects" nav link to `frontend/src/components/NavBar.tsx`, visible to every authenticated user.

## 8. Frontend Admin Project Templates page

- [ ] 8.1 Create `frontend/src/pages/AdminProjectTemplates.tsx` (and matching `AdminProjectTemplates.module.css`) rendering the list / create / edit / delete / set-default UI per `project-frontend`'s "Admin project templates page lists, creates, edits, deletes, sets default" requirement. Reuse the same admin-denial pattern as `AdminLLMProviders.tsx`.
- [ ] 8.2 Add the `/admin/project-templates` route in `frontend/src/App.tsx`, wrapped in `RouteGuard`.
- [ ] 8.3 Add the admin "Project templates" nav link to `NavBar.tsx`, gated by `is_admin`, matching the existing "Admin → LLM providers" link.

## 9. Frontend chat panel integration

- [ ] 9.1 Update `frontend/src/components/ChatPanel.tsx` to (a) call `listProjects()` on mount and on `refresh()`, (b) render the project switcher `<select>` in the chat header, and (c) render the active chat's `project_name` next to the title.
- [ ] 9.2 Wire the switcher value to local state initialised to the user-default project's id; ensure the switcher is disabled while `listProjects()` is in flight.

## 10. Verification

- [ ] 10.1 Run `openspec validate add-projects-feature` and resolve any reported issues.
- [ ] 10.2 Run the backend test suite (`npm test` in `backend/`) and confirm all new + existing tests pass.
- [ ] 10.3 Run the frontend test suite (`npm test` in `frontend/`) and confirm all new + existing tests pass.
- [ ] 10.4 Run `npm run lint` in `backend/` and `frontend/` (if configured) and resolve any reported issues.
- [ ] 10.5 Manually exercise: register a fresh user, see the user-default project auto-created; create a chat from the chat panel (lands in the user default); create a second project, mark it default, send another chat (lands in the new default); admin creates a new default template, edit a project to confirm new projects pick it up.
