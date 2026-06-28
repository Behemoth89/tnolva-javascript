## MODIFIED Requirements

### Requirement: chats and chat_messages schema

The backend SHALL persist chats and messages in SQLite via two new
tables added to `backend/src/db.ts` `initDb`. The tables SHALL be
created with `CREATE TABLE IF NOT EXISTS` and SHALL have the
following shape:

```sql
CREATE TABLE IF NOT EXISTS chats (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id                  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                       TEXT,
  default_llm_provider_model  TEXT    NOT NULL,
  created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id         INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role            TEXT    NOT NULL CHECK (role IN ('user','assistant')),
  content         TEXT    NOT NULL,
  provider_model  TEXT    NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id        ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_project_id     ON chats(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
```

The `chats.project_id` column is added as part of the
`add-projects-feature` change. Migration backfills every existing
`chats` row to its owner's user-default project, then enforces
`NOT NULL` on the column. The project schema itself is defined in
the `project-api` specification.

#### Scenario: schema is created on first startup

- **WHEN** the backend process starts against a fresh SQLite file
- **THEN** both tables exist with the columns and constraints above
- **AND** all three indexes exist

#### Scenario: schema creation is idempotent

- **WHEN** the backend process starts against a SQLite file that
  already has these tables
- **THEN** startup does not fail and the existing tables are
  preserved

#### Scenario: messages cascade on chat delete

- **WHEN** a chat row is deleted
- **THEN** every `chat_messages` row with a matching `chat_id` is
  also removed

#### Scenario: chats cascade on user delete

- **WHEN** a `users` row is deleted
- **THEN** every `chats` row with a matching `user_id` is also
  removed
- **AND** every `chat_messages` row with a `chat_id` in that set
  is also removed

#### Scenario: chats cascade on project delete

- **WHEN** a `projects` row is deleted
- **THEN** every `chats` row with a matching `project_id` is also
  removed
- **AND** every `chat_messages` row with a `chat_id` in that set
  is also removed

### Requirement: POST /api/chats creates a chat

The backend SHALL expose `POST /api/chats`, guarded by
`requireAuth`, accepting a JSON body of
`{ "title"?: string, "default_llm_provider_model": string,
"project_id"?: number }`. The endpoint SHALL set `user_id` from
`req.auth.userId` (the body SHALL NOT contain a `user_id` field),
validate the `default_llm_provider_model` against the catalog,
resolve the `project_id` as described below, and return HTTP 201
with the persisted chat row.

`project_id` resolution:

- If the body includes `project_id`, the project is loaded scoped
  to `req.auth.userId`. A project that exists but belongs to
  another user SHALL behave exactly like a missing project (404,
  no body leak). On success the chat's `project_id` is set to
  that value.
- If the body omits `project_id`, the chat is created in the
  caller's user-default project (the project with
  `is_user_default = 1` for `req.auth.userId`). If the user has
  no user-default project at the time of the call, the backend
  SHALL materialise one (the lazy-seed rule from `project-api`)
  and use it.

#### Scenario: chat is created with title and default model

- **WHEN** an authenticated user posts
  `{ "title": "Design review",
  "default_llm_provider_model": "anthropic:claude-sonnet-4-6" }`
  to `/api/chats`
- **AND** the user has a user-default project P
- **THEN** the response status is 201
- **AND** the response body has `id` as a positive integer
- **AND** the response body has `user_id === req.auth.userId`
- **AND** the response body has `project_id === P.id`
- **AND** the response body has
  `default_llm_provider_model === "anthropic:claude-sonnet-4-6"`

#### Scenario: chat is created with a null title

- **WHEN** an authenticated user posts
  `{ "default_llm_provider_model": "anthropic:claude-sonnet-4-6" }`
  to `/api/chats`
- **THEN** the response status is 201
- **AND** the response body's `title` is `null`

#### Scenario: chat is created in an explicit project

- **WHEN** an authenticated user owns project P
- **AND** the user posts
  `{ "title": "Trip ideas",
  "default_llm_provider_model": "anthropic:claude-sonnet-4-6",
  "project_id": P.id }`
  to `/api/chats`
- **THEN** the response status is 201
- **AND** the response body has `project_id === P.id`

#### Scenario: explicit project_id owned by another user is rejected

- **WHEN** user B owns project P
- **AND** user A posts `{ "title": "x",
  "default_llm_provider_model": "anthropic:claude-sonnet-4-6",
  "project_id": P.id }`
- **THEN** the response status is 404
- **AND** no row is inserted

#### Scenario: missing default_llm_provider_model is rejected

- **WHEN** an authenticated user posts `{ "title": "x" }` to
  `/api/chats`
- **THEN** the response status is 400
- **AND** the response body is `{ "error": "..." }`

## ADDED Requirements

### Requirement: chat responses include project_id and project_name

The `GET /api/chats`, `GET /api/chats/:id`, and `POST /api/chats` responses MUST include `project_id` (number) and `project_name` (string) on every chat row, in addition to the existing fields.
The values SHALL be loaded from the chat's `project_id` row in the same query (a `LEFT JOIN projects ON projects.id = chats.project_id`).

#### Scenario: listChats includes project context

- **WHEN** user A calls `GET /api/chats`
- **THEN** every chat in the response has a `project_id` matching
  one of user A's projects
- **AND** every chat in the response has the matching
  `project_name`

#### Scenario: getChat includes project context

- **WHEN** user A calls `GET /api/chats/:id` for a chat they own
- **THEN** the response body has `project_id` and `project_name`

### Requirement: system prompt is resolved from the chat's project at send-time

`POST /api/chats/:id/messages` SHALL resolve the chat's project
via the existing chat lookup, and SHALL pass the project's
`system_prompt` (which MAY be `null`) as the `system` field of
the LLM `LlmRequest`. The system prompt is **not** stored on the
chat row; the value used at send-time is the current project
prompt, so editing a project's `system_prompt` immediately
affects subsequent messages in all of that project's chats.

#### Scenario: project system_prompt is sent as the LLM system field

- **WHEN** a chat belongs to a project with
  `system_prompt = "You are concise."`
- **AND** user A posts `{ "content": "hi" }` to
  `/api/chats/:id/messages`
- **THEN** the LLM dispatch receives `LlmRequest.system === "You
  are concise."`

#### Scenario: null project system_prompt sends no system field content

- **WHEN** a chat belongs to a project with
  `system_prompt = null`
- **AND** user A posts `{ "content": "hi" }` to
  `/api/chats/:id/messages`
- **THEN** the LLM dispatch receives `LlmRequest.system === null`
  (no system prompt is sent for this message)
