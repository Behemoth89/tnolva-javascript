## Context

Today the chat product has a flat list of `chats` per user, each with a `default_llm_provider_model`. There is no concept of a "project" — a place to group chats, configure a system prompt, or share defaults. The admin can configure LLM providers and their models, but has no way to influence the initial chat experience for users beyond the first user being an admin.

The change adds a Projects layer between users and chats, and a Project Templates layer between admins and the per-user default project. The product surface is:

- Admins define one or more Project Templates. Exactly one template is the default; the default template seeds a Project for every user on first access.
- Each user owns one or more Projects. One Project is the user's "user default" (always present, cannot be deleted while it is the default). All chats belong to a Project.
- The chat panel lets the user see and switch the active Project. New chats created without an explicit `project_id` go to the user-default Project.

Constraints inherited from the existing codebase:

- Backend is Node/Express + better-sqlite3, all schema lives in `backend/src/db.ts` `initDb`, every admin route is `requireAuth + requireAdmin`, every chat route is `requireAuth`. The codebase pattern is one folder per feature (`chats/`, `auth/`, `admin/`) with `repos.ts`, `router.ts`, `validation.ts`, and `service.ts` where applicable.
- Frontend is React + Vite + react-router, state is per-component `useState` + `useEffect` + manual `refresh()`, and admin pages use the same `RouteGuard` + client-side `is_admin` pattern.
- Existing `chats` table has a `user_id` foreign key and is backfilled on user delete via `ON DELETE CASCADE`.

## Goals / Non-Goals

**Goals:**

- Add a `project_templates` table managed by admins under `/api/admin/project-templates`. Exactly one row has `is_default = 1` at any time.
- Add a `projects` table owned by users under `/api/projects`. A user always has exactly one project with `is_user_default = 1`; the project seeded from the default template is the initial user-default.
- Backfill existing users at migration time: create a `projects` row from the current `is_default` template (or a hard-coded fallback if no template exists yet), mark it `is_user_default = 1`, and assign every existing `chats` row to it.
- Add `project_id NOT NULL REFERENCES projects(id) ON DELETE CASCADE` to `chats`. Chat endpoints accept an optional `project_id`; when omitted, the chat is created in the caller's user-default project.
- Lazy seed: when an authenticated user has zero projects, the backend materializes one from the current default template on the next project read/write.
- Frontend: `/projects` page (user projects list, create, rename, delete; default is marked and not deletable; "Make default" action), and `/admin/project-templates` page (admin only; list, create, edit, delete; "Make default" action). ChatPanel shows the active project name and a project switcher.
- Resolve the system prompt from the active Project on `POST /api/chats/:id/messages`, and have the LLM dispatch include it as the `system` field. (Chats created in the project use the project's `default_llm_provider_model` as their own default; per-chat override stays as today.)

**Non-Goals:**

- Sharing projects between users (collaboration). Projects are strictly per-user.
- Project membership / roles. A user has full CRUD over their own projects.
- Project-level rate limits, quotas, or billing.
- Renaming the existing `chats` table or moving the system prompt onto the chat row.
- Changing the LLM provider model — that already lives on the project (and inherits to chats).
- Streaming responses. The LLM dispatch and chat service remain non-streaming as in `chat-api`.

## Decisions

### Two-tier model: `project_templates` (admin) + `projects` (user)

The proposal offered two possible shapes: a single `projects` table with a `template_id`, or a two-tier `project_templates` + `projects` split. We choose the two-tier split.

Rationale: admins curate templates for org-wide defaults (system prompt + default model); users can clone, customise, and create their own without losing the admin's intent. The split also makes the "exactly one default template" invariant local to one table. The user-facing project has its own `name`, `system_prompt`, and `default_llm_provider_model` columns, decoupled from the template that seeded it, so user edits to a project never retroactively edit the template.

Alternatives considered: a single `projects` table with a nullable `template_id` was rejected because it conflates "this is a template (admin)" with "this is a user's instance", and makes the one-default-template invariant awkward (a project row vs. a template marker).

### Lazy seed: user default project is created on first read

When a user authenticates and calls `GET /api/projects`, the backend guarantees at least one row exists. If none, the backend materialises one from the current default `project_templates.is_default = 1` row. If no default template exists (bootstrap edge case), the backend creates a system-default project with `name = "Default"`, `system_prompt = NULL`, and `default_llm_provider_model` resolved from any registered LLM provider/model (or `NULL` if the catalog is empty — chat creation is rejected in that case per existing `chat-api` rules).

Rationale: avoids a separate provisioning step on user registration; matches the "open the app, start chatting" flow. Materialisation is guarded by a transaction with `SELECT ... WHERE user_id = ? AND is_user_default = 1` first, so concurrent first-reads cannot create duplicates.

Alternatives considered: seeding on registration in `auth/router.ts`. Rejected because it would couple the auth feature to the projects feature and require a migration step for existing users. Lazy seed is additive and idempotent.

### `chats.project_id` is `NOT NULL` and cascades

A chat must always belong to a project. Migration adds the column as nullable, backfills every existing `chats` row to its owner's user-default project, then alters the column to `NOT NULL` in the same transaction. `ON DELETE CASCADE` on `project_id` matches the existing `user_id` cascade.

Rationale: keeps the chat invariant simple (`project_id` always present), enables the system prompt lookup at send-time via a single join, and matches the cascade style already used by `chats → chat_messages` and `chats → users`.

### Default project resolution on `POST /api/chats`

When the request body omits `project_id`, the chat is created in the caller's `is_user_default = 1` row. When the body includes `project_id`, the row is loaded scoped to `req.auth.userId`; mismatched owners get 404 (no body leak, matching the existing chat pattern).

Rationale: this keeps the chat surface mostly unchanged for the typical "just start a chat" flow and adds an explicit opt-in for power users.

### System prompt is read from the project at send-time

`POST /api/chats/:id/messages` resolves the chat's project, reads `projects.system_prompt`, and passes it as the LLM `system` field on dispatch. The system prompt is **not** stored on the chat row; sending a message always uses the current project prompt.

Rationale: a user editing a project's system prompt affects all chats in that project immediately, which matches user mental model. Storing the prompt on the chat row would freeze it at chat creation and surprise users when they edit the project.

### `is_default` enforcement on `project_templates`

The admin endpoint that creates or updates a template SHALL never let two rows have `is_default = 1`. Two options: (a) a CHECK constraint in SQLite (not natively supported — would need a trigger), or (b) transactional clear-then-set in the repository. We choose (b): within a transaction, `UPDATE project_templates SET is_default = 0` is issued, then the target row is updated. SQLite's `IMMEDIATE` transaction makes the invariant race-safe.

### Frontend: project switcher is a `<select>` over `GET /api/projects`

The chat panel shows the active project and a `<select>` populated by `GET /api/projects`. Changing the value sets a piece of component state (`activeProjectId`). The "new chat" action and message sends do not pass `project_id`; they rely on the backend's user-default rule. A future iteration can pass `project_id` explicitly; the API already supports it.

Rationale: matches the existing "the backend picks the right thing" pattern in the codebase, where the frontend never duplicates business rules. The `<select>` is a thin client-side decision for the *display* of which project the next chat lands in, but we keep the implementation honest by relying on the backend default for the actual writes — and document this clearly in the spec.

## Risks / Trade-offs

- **Migration backfill on a large `chats` table** is O(n). For a personal app this is fine; for a multi-tenant install it would need a batched or online backfill. → Mitigation: run the backfill inside the same transaction as the schema change; better-sqlite3 is synchronous and small-N backfills complete in milliseconds.
- **Cascade delete of a project wipes its chats**. → Mitigation: `DELETE /api/projects/:id` rejects with 409 if the project is the user default; the docs and UI both surface "default projects cannot be deleted" and the user must promote another project to default first.
- **Editing a template does NOT retroactively update existing user projects** (by design). → Mitigation: the admin UI shows the template's name and the count of projects seeded from it, and the docs say "edits apply to new projects only".
- **System prompt at send-time is a join on every message** → Mitigation: the join is `projects.id = ?` and is index-covered; the prompt is not large.
- **Project switcher UI is a single dropdown** — does not yet show "default" badges in the chat list or the chat panel. → Mitigation: documented in `project-frontend` as a v1 simplification; the data model supports the badge already (`is_user_default`).
- **No project rename of all chats in one action** → out of scope; chat titles remain independent.

## Migration Plan

1. Apply schema additions in a single transaction inside `db.ts` `initDb`:
   - `CREATE TABLE IF NOT EXISTS project_templates (...)` with `is_default INTEGER NOT NULL DEFAULT 0` and `CHECK (is_default IN (0,1))`.
   - `CREATE TABLE IF NOT EXISTS projects (...)` with `is_user_default INTEGER NOT NULL DEFAULT 0`, `CHECK (is_user_default IN (0,1))`, and `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
   - `ALTER TABLE chats ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE` (note: SQLite cannot add a FK constraint via ALTER, so the FK is enforced at the application layer for the duration of the migration, and re-asserted via a `PRAGMA foreign_key_check` after backfill).
   - For each user with zero projects: create one from the current `is_default` template (or a system fallback), mark `is_user_default = 1`.
   - `UPDATE chats SET project_id = (SELECT id FROM projects WHERE projects.user_id = chats.user_id AND projects.is_user_default = 1) WHERE project_id IS NULL`.
   - New SQLite rebuild step: copy `chats` into a temp table with `project_id INTEGER NOT NULL`, copy back, drop the temp. (SQLite cannot add `NOT NULL` to an existing column in place; the rebuild enforces the constraint.)
2. No data loss path: the rebuild happens inside a transaction. A failed backfill leaves the database unchanged.
3. Rollback: re-deploy the previous backend; the old code reads `chats` without `project_id` and the new columns are simply ignored. Forward re-application of the migration is idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, the backfill uses `WHERE project_id IS NULL`).
4. Frontend: deploy the new code. Old frontend still works because `GET /api/chats` adds `project_id` and `project_name` but the old client ignores the new fields.

## Open Questions

- Should the system-default fallback (used when no admin template exists) include a hard-coded `system_prompt`, or always be `NULL` and leave prompt configuration to the user? — Implementation choice; spec says `NULL` is acceptable.
- Should the `project_templates` table be seeded with a single "Conversational assistant" template on a fresh database, or left empty? — Spec leaves it empty and lets admins configure; the lazy seed falls back to a system default.
- Should deleting a non-default project also offer "reassign its chats to the user default" as an option, or always cascade? — Spec chooses cascade for simplicity; the UI can warn.
