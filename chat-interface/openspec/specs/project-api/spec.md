# project-api Specification

## Purpose

Define the backend persistence, REST API, and validation for project
templates (admin-managed) and projects (user-owned), and the rule
that a chat belongs to a project. The system SHALL persist
`project_templates` and `projects` tables in SQLite, expose
`/api/admin/project-templates/*` and `/api/projects/*` endpoints
scoped to the appropriate caller, and guarantee that every
authenticated user has exactly one `is_user_default = 1` project at
all times (lazily seeded from the current default template on first
read).

## ADDED Requirements

### Requirement: project_templates schema

The backend SHALL persist project templates in SQLite via a new
table added to `backend/src/db.ts` `initDb`. The table SHALL be
created with `CREATE TABLE IF NOT EXISTS` and SHALL have the
following shape:

```sql
CREATE TABLE IF NOT EXISTS project_templates (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  name                        TEXT    NOT NULL,
  system_prompt               TEXT,
  default_llm_provider_model  TEXT    NOT NULL,
  is_default                  INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_templates_is_default
  ON project_templates(is_default) WHERE is_default = 1;
```

The `is_default` partial unique index ensures at most one row has
`is_default = 1` at the database level. The `default_llm_provider_model`
column SHALL reference a registered `<provider>:<model>` pair per
the catalog rule inherited from `chat-api`.

#### Scenario: schema is created on first startup

- **WHEN** the backend process starts against a fresh SQLite file
- **THEN** the `project_templates` table exists with the columns
  and constraints above
- **AND** the partial unique index exists

#### Scenario: schema creation is idempotent

- **WHEN** the backend process starts against a SQLite file that
  already has this table
- **THEN** startup does not fail and the existing table is
  preserved

#### Scenario: at most one default template is enforced at the database level

- **WHEN** two rows with `is_default = 1` are attempted (by any
  concurrent process or bug)
- **THEN** the second insert/update fails with a unique-constraint
  error

### Requirement: projects schema

The backend SHALL persist projects in SQLite via a new table added
to `backend/src/db.ts` `initDb`. The table SHALL be created with
`CREATE TABLE IF NOT EXISTS` and SHALL have the following shape:

```sql
CREATE TABLE IF NOT EXISTS projects (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                        TEXT    NOT NULL,
  system_prompt               TEXT,
  default_llm_provider_model  TEXT    NOT NULL,
  is_user_default             INTEGER NOT NULL DEFAULT 0 CHECK (is_user_default IN (0,1)),
  created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON projects(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_default
  ON projects(user_id) WHERE is_user_default = 1;
```

The `is_user_default` partial unique index ensures at most one
project per user has `is_user_default = 1` at the database level.

#### Scenario: schema is created on first startup

- **WHEN** the backend process starts against a fresh SQLite file
- **THEN** the `projects` table exists with the columns and
  constraints above
- **AND** both indexes exist

#### Scenario: schema creation is idempotent

- **WHEN** the backend process starts against a SQLite file that
  already has this table
- **THEN** startup does not fail and the existing table is
  preserved

#### Scenario: projects cascade on user delete

- **WHEN** a `users` row is deleted
- **THEN** every `projects` row with a matching `user_id` is also
  removed
- **AND** every `chats` row with a `project_id` in that set is
  also removed (via the `chats.project_id` foreign key cascade)

#### Scenario: at most one user-default project per user is enforced

- **WHEN** two rows for the same `user_id` with `is_user_default = 1`
  are attempted
- **THEN** the second insert/update fails with a unique-constraint
  error

### Requirement: GET /api/admin/project-templates lists templates

The backend SHALL expose `GET /api/admin/project-templates`,
guarded by `requireAuth` and `requireAdmin`, returning the full
list of `project_templates` rows ordered by `created_at ASC`. The
response SHALL include `id`, `name`, `system_prompt`,
`default_llm_provider_model`, `is_default`, `created_at`, and
`updated_at`. The endpoint is admin-only; non-admin authenticated
callers receive 403; unauthenticated callers receive 401.

#### Scenario: admin lists templates

- **WHEN** an admin user sends `GET /api/admin/project-templates`
- **AND** two template rows exist (one default, one not)
- **THEN** the response status is 200
- **AND** the response body is an array of length 2
- **AND** every element has the fields above
- **AND** exactly one element has `is_default = 1`

#### Scenario: non-admin is forbidden

- **WHEN** a non-admin authenticated user sends
  `GET /api/admin/project-templates`
- **THEN** the response status is 403

#### Scenario: anonymous is unauthorized

- **WHEN** an unauthenticated request hits
  `GET /api/admin/project-templates`
- **THEN** the response status is 401

### Requirement: POST /api/admin/project-templates creates a template

The backend SHALL expose `POST /api/admin/project-templates`,
guarded by `requireAuth` and `requireAdmin`, accepting a JSON body
of
`{ "name": string, "system_prompt"?: string | null, "default_llm_provider_model": string, "is_default"?: boolean }`.
On success the row is persisted and the response is 201 with the
created template. If `is_default` is `true`, the endpoint SHALL
clear the existing default (`UPDATE project_templates SET
is_default = 0` for all other rows) inside the same transaction,
then set the new row's `is_default = 1`. If `is_default` is
omitted or `false`, the new row has `is_default = 0`. The
`default_llm_provider_model` SHALL be validated against the LLM
catalog; 400 if invalid.

#### Scenario: template is created with is_default = false

- **WHEN** an admin posts
  `{ "name": "Coding helper",
  "default_llm_provider_model": "anthropic:claude-sonnet-4-6" }`
  to `/api/admin/project-templates`
- **THEN** the response status is 201
- **AND** the response body has `is_default = 0`
- **AND** the response body has `name = "Coding helper"`
- **AND** the response body has
  `default_llm_provider_model = "anthropic:claude-sonnet-4-6"`

#### Scenario: creating a default template clears the previous default

- **WHEN** a template with `is_default = 1` exists
- **AND** an admin posts a new template with `is_default = true`
- **THEN** the response status is 201
- **AND** the new row has `is_default = 1`
- **AND** the previously-default row now has `is_default = 0`
- **AND** no two rows have `is_default = 1` after the call

#### Scenario: missing name is rejected

- **WHEN** an admin posts `{ "default_llm_provider_model":
  "anthropic:claude-sonnet-4-6" }` to
  `/api/admin/project-templates`
- **THEN** the response status is 400

#### Scenario: invalid default_llm_provider_model is rejected

- **WHEN** an admin posts
  `{ "name": "x", "default_llm_provider_model": "mystery:y" }`
- **THEN** the response status is 400
- **AND** no row is inserted

### Requirement: PATCH /api/admin/project-templates/:id updates a template

The backend SHALL expose
`PATCH /api/admin/project-templates/:id`, guarded by
`requireAuth` and `requireAdmin`, accepting any subset of
`{ "name", "system_prompt", "default_llm_provider_model",
"is_default" }`. The `default_llm_provider_model` SHALL be
re-validated if present. When `is_default` is set to `true`, the
endpoint SHALL clear the existing default in the same transaction
before setting the target row. The response is 200 with the
updated template. 404 when the id is unknown.

#### Scenario: name is updated

- **WHEN** an admin patches a template with `{ "name": "New name" }`
- **THEN** the response status is 200
- **AND** the response body has `name = "New name"`

#### Scenario: setting is_default clears the previous default

- **WHEN** template A has `is_default = 1` and template B has
  `is_default = 0`
- **AND** an admin patches template B with `{ "is_default": true }`
- **THEN** the response status is 200
- **AND** template B's `is_default = 1`
- **AND** template A's `is_default = 0`

#### Scenario: unknown id returns 404

- **WHEN** an admin patches `/api/admin/project-templates/999999`
- **THEN** the response status is 404

### Requirement: DELETE /api/admin/project-templates/:id removes a template

The backend SHALL expose
`DELETE /api/admin/project-templates/:id`, guarded by
`requireAuth` and `requireAdmin`. The response is 204 on success.
Deleting the default template SHALL clear the `is_default` flag
(no other row is auto-promoted). Deletion SHALL fail with 409 if
the template has been used to seed any user project (i.e., the
`template_id` reference on `projects` matches; for v1 we do not
add `template_id` to `projects`, so this rule is forward-looking
and the implementation SHALL allow delete in v1).

#### Scenario: non-default template is deleted

- **WHEN** an admin deletes a template that has `is_default = 0`
- **THEN** the response status is 204
- **AND** a subsequent `GET /api/admin/project-templates` no
  longer includes that row

#### Scenario: deleting the default template clears the flag

- **WHEN** template A has `is_default = 1` and is the only row
- **AND** an admin deletes template A
- **THEN** the response status is 204
- **AND** no row has `is_default = 1` afterward
- **AND** subsequent `GET /api/projects` calls fall back to the
  system default (no `system_prompt`, `default_llm_provider_model`
  resolved from the LLM catalog or `NULL` if the catalog is empty)

#### Scenario: unknown id returns 404

- **WHEN** an admin deletes `/api/admin/project-templates/999999`
- **THEN** the response status is 404

### Requirement: GET /api/projects lists the current user's projects

The backend SHALL expose `GET /api/projects`, guarded by
`requireAuth`, returning the authenticated user's projects
ordered by `created_at ASC`. Each entry SHALL include `id`,
`user_id`, `name`, `system_prompt`, `default_llm_provider_model`,
`is_user_default`, `created_at`, and `updated_at`. The endpoint
SHALL guarantee that the response includes at least one project
with `is_user_default = 1`; if the user has none, the backend
materialises one before responding.

#### Scenario: authenticated user sees only their projects

- **WHEN** user A has two projects and user B has one project
- **AND** user A calls `GET /api/projects`
- **THEN** the response status is 200
- **AND** the response body is an array of exactly user A's two
  projects

#### Scenario: lazy seed creates the user-default project on first read

- **WHEN** an authenticated user calls `GET /api/projects`
- **AND** the user has zero projects
- **THEN** the response status is 200
- **AND** the response body contains exactly one project
- **AND** that project's `is_user_default = 1`
- **AND** that project's `name` is the default-template's `name`
  (or `"Default"` if no default template exists)
- **AND** that project's `default_llm_provider_model` is the
  default-template's value (or `null` if the catalog is empty)
- **AND** that project's `system_prompt` is the default-template's
  `system_prompt` (or `null`)

#### Scenario: lazy seed is race-safe

- **WHEN** two concurrent `GET /api/projects` requests arrive
  for a user with zero projects
- **THEN** exactly one row is created
- **AND** both responses include the same single project

#### Scenario: anonymous caller is rejected

- **WHEN** an unauthenticated request hits `GET /api/projects`
- **THEN** the response status is 401

### Requirement: GET /api/projects/:id returns one project

The backend SHALL expose `GET /api/projects/:id`, guarded by
`requireAuth`, returning the project scoped to
`req.auth.userId`. The response shape matches the list endpoint.
A project that exists but belongs to another user SHALL behave
exactly like a missing project (404, no body leak). 404 when the
id is unknown.

#### Scenario: owner fetches own project

- **WHEN** user A has a project with `id = 5`
- **AND** user A calls `GET /api/projects/5`
- **THEN** the response status is 200
- **AND** the response body has the project fields

#### Scenario: non-owner fetches another user's project

- **WHEN** user B has a project with `id = 5`
- **AND** user A calls `GET /api/projects/5`
- **THEN** the response status is 404
- **AND** the response body does NOT contain any of the project's
  fields

#### Scenario: missing project id

- **WHEN** an authenticated user calls `GET /api/projects/999999`
- **THEN** the response status is 404

### Requirement: GET /api/projects/default returns the user's default project

The backend SHALL expose `GET /api/projects/default`, guarded by
`requireAuth`, returning the authenticated user's project with
`is_user_default = 1`. The endpoint SHALL materialise one if
none exists (same lazy-seed rule as the list endpoint). The
response is 200 with the project.

#### Scenario: default project exists

- **WHEN** user A has a project with `is_user_default = 1`
- **AND** user A calls `GET /api/projects/default`
- **THEN** the response status is 200
- **AND** the response body is that project

#### Scenario: lazy seed on the default endpoint

- **WHEN** an authenticated user calls
  `GET /api/projects/default`
- **AND** the user has zero projects
- **THEN** the response status is 200
- **AND** the response body is a single project with
  `is_user_default = 1`

### Requirement: POST /api/projects creates a project

The backend SHALL expose `POST /api/projects`, guarded by
`requireAuth`, accepting a JSON body of
`{ "name": string, "system_prompt"?: string | null,
"default_llm_provider_model": string }`. The endpoint SHALL set
`user_id` from `req.auth.userId` (the body SHALL NOT contain a
`user_id` or `is_user_default` field), validate the
`default_llm_provider_model` against the catalog, and return 201
with the persisted project. The new project's `is_user_default`
defaults to 0. The `name` SHALL be 1–80 characters after
trimming; 400 otherwise.

#### Scenario: project is created

- **WHEN** an authenticated user posts
  `{ "name": "My research",
  "default_llm_provider_model": "anthropic:claude-sonnet-4-6",
  "system_prompt": "You are a research assistant." }`
  to `/api/projects`
- **THEN** the response status is 201
- **AND** the response body has `user_id = req.auth.userId`
- **AND** the response body has `is_user_default = 0`
- **AND** the response body has `name = "My research"`
- **AND** the response body has
  `system_prompt = "You are a research assistant."`

#### Scenario: empty name is rejected

- **WHEN** an authenticated user posts
  `{ "name": "  ",
  "default_llm_provider_model": "anthropic:claude-sonnet-4-6" }`
- **THEN** the response status is 400
- **AND** no row is inserted

#### Scenario: missing default_llm_provider_model is rejected

- **WHEN** an authenticated user posts `{ "name": "x" }`
- **THEN** the response status is 400

### Requirement: PATCH /api/projects/:id updates a project

The backend SHALL expose `PATCH /api/projects/:id`, guarded by
`requireAuth`, scoped to `req.auth.userId`, accepting any subset
of `{ "name", "system_prompt", "default_llm_provider_model" }`.
At least one field SHALL be present; 400 otherwise. The
`default_llm_provider_model` SHALL be re-validated if present.
The response is 200 with the updated project. 404 when the id is
unknown or owned by another user.

#### Scenario: name is updated

- **WHEN** user A patches their project with `{ "name": "New name" }`
- **THEN** the response status is 200
- **AND** the response body has `name = "New name"`

#### Scenario: system_prompt is updated to null

- **WHEN** user A patches their project with
  `{ "system_prompt": null }`
- **THEN** the response status is 200
- **AND** the response body has `system_prompt = null`

#### Scenario: empty body is rejected

- **WHEN** user A patches their project with `{}`
- **THEN** the response status is 400

#### Scenario: non-owner cannot update

- **WHEN** user A patches user B's project
- **THEN** the response status is 404
- **AND** the project is unchanged

### Requirement: POST /api/projects/:id/make-default promotes a project to user default

The backend SHALL expose
`POST /api/projects/:id/make-default`, guarded by
`requireAuth`, scoped to `req.auth.userId`. Inside one
transaction the endpoint SHALL clear `is_user_default = 0` for
every other project owned by the user, then set the target
project's `is_user_default = 1`. The response is 200 with the
updated target project. 404 when the id is unknown or owned by
another user.

#### Scenario: another project is the previous default

- **WHEN** user A has project X with `is_user_default = 1` and
  project Y with `is_user_default = 0`
- **AND** user A posts to `/api/projects/Y/make-default`
- **THEN** the response status is 200
- **AND** project Y has `is_user_default = 1`
- **AND** project X has `is_user_default = 0`

#### Scenario: non-owner is rejected

- **WHEN** user A posts to `/api/projects/B/make-default` for
  user B's project
- **THEN** the response status is 404

### Requirement: DELETE /api/projects/:id removes a project

The backend SHALL expose `DELETE /api/projects/:id`, guarded by
`requireAuth`, scoped to `req.auth.userId`. The response is 204
on success; the project row and all `chats` rows with
`project_id` matching the project are removed via cascade. The
endpoint SHALL return 409 when the project has
`is_user_default = 1`; the caller must promote another project to
default first.

#### Scenario: non-default project is deleted

- **WHEN** user A deletes a project with `is_user_default = 0`
  that has two chats
- **THEN** the response status is 204
- **AND** a subsequent `GET /api/projects/:id` returns 404
- **AND** no `chats` rows with that `project_id` exist

#### Scenario: user-default project cannot be deleted

- **WHEN** user A deletes a project with `is_user_default = 1`
- **THEN** the response status is 409
- **AND** the project still exists

#### Scenario: non-owner cannot delete

- **WHEN** user A deletes user B's project
- **THEN** the response status is 404
- **AND** the project still exists

### Requirement: project endpoints return JSON { "error": string } on failure

Every error response from `/api/projects/*` and `/api/admin/project-templates/*` SHALL be JSON with a single `error` string field. Status codes SHALL be:

- 400 — validation (missing field, bad `provider_model`, empty
  name, empty body for PATCH)
- 401 — `requireAuth` failure
- 403 — `requireAdmin` failure
- 404 — project / template not found or not owned by the caller
- 409 — delete the user-default project
- 500 — unexpected server error

#### Scenario: 400 body shape

- **WHEN** any project endpoint returns 400
- **THEN** the response Content-Type is `application/json`
- **AND** the body parses to an object with a single `error`
  string

#### Scenario: 409 on deleting the user default

- **WHEN** user A deletes their user-default project
- **THEN** the response status is 409
- **AND** the response body has `error` describing the rule
  (e.g., "Cannot delete the default project; promote another
  project to default first")
