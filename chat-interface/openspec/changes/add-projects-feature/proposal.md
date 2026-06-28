## Why

The chat experience today has a flat list of chats with no way to group related conversations or configure a system prompt per group. We need a Projects layer: a user owns one or more named projects, a chat belongs to a single project, and a single admin-defined default project template is used to seed each user's default project. This unlocks per-project system prompts, per-project default models, and a coherent "starting point" for users who don't want to pick a project manually.

## What Changes

- Add a `project_templates` table managed by admins. One template is flagged as the default; that template is used to seed a project for every user.
- Add a `projects` table owned by users, seeded from the default template on first access. Each user has exactly one "user default" project; additional projects are user-defined.
- Add `project_id` to `chats`. Chat creation accepts an optional `project_id`; if omitted, the chat is created in the caller's user-default project.
- Backend: project CRUD under `/api/projects` (user-scoped), project-template CRUD under `/api/admin/project-templates` (admin-scoped).
- Frontend: a Projects page for users (list, create, rename, delete; switch the active project for the chat panel; one project is marked as the default and cannot be deleted while it is the default). An Admin Projects Template page for admins (list templates, set the default, edit fields). The chat panel surfaces the active project and lets the user pick a different one.

## Capabilities

### New Capabilities

- `project-api`: Backend persistence, REST API, and validation for project templates (admin) and projects (user). Defines the default-template-to-default-project seeding behavior and the chat project-resolution rule.
- `project-frontend`: Frontend API client, Projects page, and admin project-template page. Updates the chat panel to expose the active project and a project switcher.

### Modified Capabilities

- `chat-api`: The `chats` table gains a non-null `project_id` foreign key. `POST /api/chats` accepts an optional `project_id`; when omitted the chat is placed in the caller's user-default project. `GET /api/chats` and `GET /api/chats/:id` responses include `project_id` (and `project_name`).
- `chat-frontend`: The chat panel surfaces the active project name, allows switching the project used for the next message, and the API client types include `project_id` and `project_name`.

## Impact

- Backend: new `backend/src/projects/` module (repos, router, validation) following the pattern of `chats/` and `admin/`. New admin routes mounted in `backend/src/app.ts`. `backend/src/db.ts` adds two new tables and migrates the `chats` table to include `project_id` (defaulting the new column to the user's user-default project at migration time). `backend/src/chats/` is updated to read/write the new column and resolve the project.
- Frontend: new `frontend/src/api/projects.ts`, new `frontend/src/pages/Projects.tsx`, new `frontend/src/pages/AdminProjectTemplates.tsx`, new route entries in `App.tsx`, new nav links gated by `is_admin` in `NavBar.tsx`. `frontend/src/components/ChatPanel.tsx` is extended with a project switcher; `frontend/src/api/chats.ts` types gain `project_id` / `project_name`.
- Schema: existing `chats` rows at the time of migration are backfilled to the owning user's user-default project, and the `chats.project_id` column is then made non-null.
- No changes to auth, LLM dispatch, or provider admin code.
