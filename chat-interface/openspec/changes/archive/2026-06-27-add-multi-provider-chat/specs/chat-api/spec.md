# chat-api Specification

## Purpose

Define the backend persistence, REST API, and provider-agnostic LLM
client for the chat feature. The system SHALL persist chats and
messages in SQLite, expose `/api/chats/*` endpoints scoped to the
authenticated user, and dispatch a non-streaming completion to the
right upstream LLM (OpenAI Chat Completions, OpenAI Responses, or
Anthropic Messages) based on a `provider_model` string, returning a
normalized response so the rest of the application never branches on
provider type.

## Requirements

### Requirement: chats and chat_messages schema

The backend SHALL persist chats and messages in SQLite via two new
tables added to `backend/src/db.ts` `initDb`. The tables SHALL be
created with `CREATE TABLE IF NOT EXISTS` and SHALL have the
following shape:

```sql
CREATE TABLE IF NOT EXISTS chats (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
```

#### Scenario: schema is created on first startup

- **WHEN** the backend process starts against a fresh SQLite file
- **THEN** both tables exist with the columns and constraints above
- **AND** both indexes exist

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

### Requirement: A chat's default model is mutable, each message's model is frozen

The `chats.default_llm_provider_model` column SHALL be updatable via
the API without rewriting any historical message. Every
`chat_messages` row's `provider_model` SHALL be set when the row is
inserted and SHALL NOT be changed thereafter; the data-access layer
MUST NOT expose any update that touches this column.

#### Scenario: updating a chat's default does not change message history

- **WHEN** a chat has three messages with
  `provider_model = "anthropic:claude-sonnet-4-6"` for each
- **AND** the chat's `default_llm_provider_model` is updated to
  `"openai:gpt-5.5"`
- **THEN** the three existing messages still report
  `"anthropic:claude-sonnet-4-6"` in subsequent reads

#### Scenario: no API mutates a message's provider_model

- **WHEN** any endpoint is called
- **THEN** no operation results in an `UPDATE chat_messages SET
  provider_model = ...` statement being issued

### Requirement: provider_model is an opaque `<provider>:<model>` string

A `provider_model` value SHALL match the regular expression
`^[A-Za-z0-9._-]+:[A-Za-z0-9._:-]+$` (non-empty provider segment,
non-empty model segment, both segments free of colons / whitespace).
The provider segment SHALL match the `name` of a row in
`llm_providers`; the model segment SHALL match the `name` of a row
in `llm_provider_models` whose `llm_provider_id` references the
same provider. The pair is invalid (and rejected with HTTP 400) if
either lookup fails.

#### Scenario: well-formed provider_model is accepted

- **WHEN** the admin catalog contains a provider
  `name = "anthropic"` and a model `name = "claude-sonnet-4-6"`
  linked to that provider
- **AND** a chat is created with
  `default_llm_provider_model = "anthropic:claude-sonnet-4-6"`
- **THEN** the chat is persisted

#### Scenario: malformed provider_model is rejected

- **WHEN** a chat is created with
  `default_llm_provider_model = "claude-sonnet-4-6"` (no provider
  segment)
- **THEN** the API returns HTTP 400
- **AND** the response body is `{ "error": "..." }`
- **AND** no row is inserted

#### Scenario: provider not in catalog is rejected

- **WHEN** the admin catalog has no provider named
  `"mystery-provider"`
- **AND** a chat is created with
  `default_llm_provider_model = "mystery-provider:large"`
- **THEN** the API returns HTTP 400
- **AND** no row is inserted

#### Scenario: model not in provider's catalog is rejected

- **WHEN** the admin catalog has a provider `"anthropic"` but no
  model named `"gpt-99"` under it
- **AND** a chat is created with
  `default_llm_provider_model = "anthropic:gpt-99"`
- **THEN** the API returns HTTP 400
- **AND** no row is inserted

### Requirement: GET /api/chats lists the current user's chats

The backend SHALL expose `GET /api/chats`, guarded by `requireAuth`,
returning the authenticated user's chats ordered by `created_at
DESC`. Each entry SHALL include `id`, `user_id`, `title`,
`default_llm_provider_model`, and `created_at`. Other users' chats
SHALL NOT appear in the response.

#### Scenario: authenticated user sees only their chats

- **WHEN** user A has two chats and user B has one chat
- **AND** user A calls `GET /api/chats`
- **THEN** the response status is 200
- **AND** the response body is an array of exactly user A's two
  chats

#### Scenario: anonymous caller is rejected

- **WHEN** an unauthenticated request hits `GET /api/chats`
- **THEN** the response status is 401
- **AND** the response body is `{ "error": "Not authenticated" }`

### Requirement: POST /api/chats creates a chat

The backend SHALL expose `POST /api/chats`, guarded by
`requireAuth`, accepting a JSON body of
`{ "title"?: string, "default_llm_provider_model": string }`. The
endpoint SHALL set `user_id` from `req.auth.userId` (the body SHALL
NOT contain a `user_id` field), validate the
`default_llm_provider_model` against the catalog, and return HTTP
201 with the persisted chat row.

#### Scenario: chat is created with title and default model

- **WHEN** an authenticated user posts
  `{ "title": "Design review",
  "default_llm_provider_model": "anthropic:claude-sonnet-4-6" }`
  to `/api/chats`
- **THEN** the response status is 201
- **AND** the response body has `id` as a positive integer
- **AND** the response body has
  `user_id === req.auth.userId`
- **AND** the response body has
  `default_llm_provider_model === "anthropic:claude-sonnet-4-6"`

#### Scenario: chat is created with a null title

- **WHEN** an authenticated user posts
  `{ "default_llm_provider_model": "anthropic:claude-sonnet-4-6" }`
  to `/api/chats`
- **THEN** the response status is 201
- **AND** the response body's `title` is `null`

#### Scenario: missing default_llm_provider_model is rejected

- **WHEN** an authenticated user posts `{ "title": "x" }` to
  `/api/chats`
- **THEN** the response status is 400
- **AND** the response body is `{ "error": "..." }`

### Requirement: GET /api/chats/:id returns a chat with its messages

The backend SHALL expose `GET /api/chats/:id`, guarded by
`requireAuth`, returning
`{ ...chat, "messages": ChatMessage[] }` where `ChatMessage` is
`{ id, chat_id, role, content, provider_model, created_at }`. The
chat SHALL be loaded by `(id, user_id = req.auth.userId)`; a chat
that exists but belongs to another user SHALL behave exactly like a
missing chat (404, no body leak). The `messages` array SHALL be
ordered by `created_at ASC` then `id ASC`.

#### Scenario: owner fetches own chat

- **WHEN** user A has a chat with three messages
- **AND** user A calls `GET /api/chats/:id` with that chat's id
- **THEN** the response status is 200
- **AND** the response body has the chat fields
- **AND** the response body has `messages` as a 3-element array
  in insertion order

#### Scenario: non-owner fetches another user's chat

- **WHEN** user B has a chat
- **AND** user A calls `GET /api/chats/:id` with that chat's id
- **THEN** the response status is 404
- **AND** the response body does NOT contain any of the chat's
  fields

#### Scenario: missing chat id

- **WHEN** an authenticated user calls
  `GET /api/chats/999999`
- **THEN** the response status is 404

### Requirement: PATCH /api/chats/:id updates a chat's metadata

The backend SHALL expose `PATCH /api/chats/:id`, guarded by
`requireAuth`, accepting
`{ "title"?: string | null, "default_llm_provider_model"?: string }`.
At least one field SHALL be present. The `user_id` SHALL be the
authenticated user; other users' chats return 404. The endpoint
SHALL return the updated chat (without messages).

#### Scenario: title is updated

- **WHEN** user A patches their chat with `{ "title": "New title" }`
- **THEN** the response status is 200
- **AND** the response body has `title === "New title"`

#### Scenario: default model is updated

- **WHEN** user A patches their chat with
  `{ "default_llm_provider_model": "openai:gpt-5.5" }`
- **AND** `openai:gpt-5.5` is a registered provider+model pair
- **THEN** the response status is 200
- **AND** the response body has
  `default_llm_provider_model === "openai:gpt-5.5"`
- **AND** existing messages' `provider_model` values are unchanged

#### Scenario: empty body is rejected

- **WHEN** user A patches their chat with `{}`
- **THEN** the response status is 400

### Requirement: DELETE /api/chats/:id removes a chat and its messages

The backend SHALL expose `DELETE /api/chats/:id`, guarded by
`requireAuth`, scoped to `req.auth.userId`. On success the response
status SHALL be 204 with an empty body; the chat row and all of
its `chat_messages` rows SHALL be removed via cascade.

#### Scenario: owner deletes their chat

- **WHEN** user A deletes a chat that has two messages
- **THEN** the response status is 204
- **AND** a subsequent `GET /api/chats/:id` returns 404
- **AND** no `chat_messages` rows with that `chat_id` exist

#### Scenario: non-owner cannot delete

- **WHEN** user A calls `DELETE /api/chats/:id` for a chat owned
  by user B
- **THEN** the response status is 404
- **AND** the chat still exists

### Requirement: POST /api/chats/:id/messages sends a message and returns the updated chat

The backend SHALL expose `POST /api/chats/:id/messages`, guarded by
`requireAuth`, accepting
`{ "content": string, "provider_model"?: string }`. The endpoint
SHALL:

1. Load the chat scoped to `req.auth.userId`; 404 if missing or
   not owned.
2. Resolve the effective `provider_model`: the body field if
   provided and valid, otherwise the chat's
   `default_llm_provider_model`. The resolved value MUST be
   validated against the catalog; 400 if invalid.
3. Persist a new `chat_messages` row with
   `role = 'user'`, `content = body.content`,
   `provider_model = resolved` (this is the user message; it
   persists even if step 4 fails).
4. Dispatch a non-streaming completion to the resolved provider
   using the ordered message history (the user message just
   persisted plus every prior `chat_messages` row for this chat
   in `created_at` order, translated into the provider's expected
   shape).
5. On success, persist a second `chat_messages` row with
   `role = 'assistant'`, the returned text, and
   `provider_model = resolved`.
6. On dispatch failure (network, timeout, 4xx, 5xx), the user
   message from step 3 remains in the database; the assistant
   message is NOT persisted; the response status is 502 with
   `{ "error": "Upstream LLM failed: <kind>" }` and the
   already-persisted user message is included in the response so
   the client can resync.
7. On success, the response status is 200 and the response body is
   the full updated chat (`GET /api/chats/:id` shape) so the
   client can replace local state in one call.

#### Scenario: message is sent and reply is persisted

- **WHEN** user A has a chat with two prior messages and posts
  `{ "content": "What is X?" }` to `/api/chats/:id/messages`
- **AND** the resolved provider returns the text "X is …"
- **THEN** the response status is 200
- **AND** the response body is the full chat with `messages`
  containing the two prior messages plus the new user message
  plus the new assistant message "X is …" (4 entries total)
- **AND** the new user message row has
  `provider_model === chat.default_llm_provider_model`
- **AND** the new assistant message row has
  `provider_model === chat.default_llm_provider_model`

#### Scenario: per-message provider_model override

- **WHEN** user A posts
  `{ "content": "What is X?",
  "provider_model": "openai:gpt-5.5" }` to
  `/api/chats/:id/messages`
- **AND** the chat's default is
  `"anthropic:claude-sonnet-4-6"`
- **THEN** the user message is dispatched to
  `openai:gpt-5.5`
- **AND** the user message row's
  `provider_model === "openai:gpt-5.5"`
- **AND** the assistant message row's
  `provider_model === "openai:gpt-5.5"`
- **AND** the chat's
  `default_llm_provider_model` is unchanged

#### Scenario: empty content is rejected

- **WHEN** an authenticated user posts `{ "content": "" }` to
  `/api/chats/:id/messages`
- **THEN** the response status is 400
- **AND** no `chat_messages` row is inserted

#### Scenario: user message persists when LLM fails

- **WHEN** user A posts `{ "content": "hi" }` and the resolved
  provider returns 500
- **THEN** the response status is 502
- **AND** a `chat_messages` row exists with
  `role = 'user'`, `content = "hi"`, and
  `provider_model = chat.default_llm_provider_model`
- **AND** no `chat_messages` row with
  `role = 'assistant'` exists for this send

#### Scenario: non-owner cannot send

- **WHEN** user A posts to `/api/chats/:id/messages` for a chat
  owned by user B
- **THEN** the response status is 404
- **AND** no `chat_messages` row is inserted

### Requirement: GET /api/chats/models lists available provider+model pairs

The backend SHALL expose `GET /api/chats/models`, guarded by
`requireAuth`, returning the cross product of `llm_providers` and
their registered `llm_provider_models` joined by `llm_provider_id`.
Each entry SHALL be
`{ provider_model: "<provider>:<model>", provider_name, model_name, type }`.
The endpoint is reachable by any authenticated user (not
admin-gated) so the chat page's model selector can populate.

#### Scenario: authenticated user gets the cross product

- **WHEN** the admin catalog has provider `anthropic` with model
  `claude-x` and provider `openai` with model `gpt-x`
- **AND** any authenticated user calls `GET /api/chats/models`
- **THEN** the response status is 200
- **AND** the body includes `{ provider_model:
  "anthropic:claude-x", provider_name: "anthropic", model_name:
  "claude-x", type: "anthropic" }`
- **AND** the body includes `{ provider_model: "openai:gpt-x", ... }`

#### Scenario: anonymous caller is rejected

- **WHEN** an unauthenticated request hits `GET /api/chats/models`
- **THEN** the response status is 401

### Requirement: LlmClient interface normalizes three upstream providers

The backend SHALL provide an `LlmClient` interface and three
implementations:

- `openai_completions` → `POST {url}/v1/chat/completions` with
  `Authorization: Bearer <apiKey>`. Request body uses the OpenAI
  Chat Completions shape; the system prompt is encoded as the
  first message with `role: "system"`.
- `openai_responses` → `POST {url}/v1/responses` with
  `Authorization: Bearer <apiKey>`. Request body uses the OpenAI
  Responses shape; the system prompt is encoded as the top-level
  `instructions` field.
- `anthropic` → `POST {url}/v1/messages` with
  `x-api-key: <apiKey>` and `anthropic-version` header. Request
  body uses the Anthropic Messages shape; the system prompt is
  encoded as the top-level `system` field.

All three implementations SHALL accept the same internal
`LlmRequest` shape and return the same internal `LlmResponse`
shape. The rest of the application SHALL depend only on the
interface and on a `createLlmClient(providerType)` factory; it
SHALL NOT branch on provider type after construction.

#### Scenario: openai_completions translation is correct

- **WHEN** the LlmClient is invoked with providerType
  `"openai_completions"` and an LlmRequest whose `system` is
  `"You are concise."` and `messages` is
  `[{role:"user",content:"hi"}]`
- **THEN** the upstream request body is
  `{ "model": <model>, "messages":
  [{"role":"system","content":"You are concise."},
  {"role":"user","content":"hi"}] }`
- **AND** the request includes
  `Authorization: Bearer <apiKey>`

#### Scenario: openai_responses translation is correct

- **WHEN** the LlmClient is invoked with providerType
  `"openai_responses"` and an LlmRequest with
  `system = "You are concise."` and
  `messages = [{role:"user",content:"hi"}]`
- **THEN** the upstream request body is
  `{ "model": <model>, "instructions": "You are concise.",
  "input": [{"role":"user","content":"hi"}] }`
- **AND** the request includes
  `Authorization: Bearer <apiKey>`

#### Scenario: anthropic translation is correct

- **WHEN** the LlmClient is invoked with providerType
  `"anthropic"` and an LlmRequest with
  `system = "You are concise."` and
  `messages = [{role:"user",content:"hi"}]`
- **THEN** the upstream request body is
  `{ "model": <model>, "system": "You are concise.",
  "messages": [{"role":"user","content":"hi"}] }`
- **AND** the request includes
  `x-api-key: <apiKey>` and an `anthropic-version` header

#### Scenario: LlmResponse is normalized across providers

- **WHEN** any of the three providers returns its native success
  payload containing an assistant message
- **THEN** the LlmClient returns
  `{ text: <assistant text>, usage: { inputTokens, outputTokens },
  finishReason: <one of the documented values>, raw: <full parsed
  body> }`
- **AND** the rest of the application can read `text` /
  `usage` / `finishReason` without inspecting `raw`

### Requirement: provider errors are typed and api_key is never leaked

The LlmClient SHALL throw a typed `LlmError` on:

- `kind: "network"` — fetch / DNS / connection refused / timeout
- `kind: "http"` — upstream returned 4xx or 5xx
- `kind: "parse"` — response body could not be parsed as JSON or
  did not contain the expected shape
- `kind: "rate_limited"` — upstream returned HTTP 429

The `LlmError.message` SHALL NOT contain the `apiKey` value or any
`Authorization` / `x-api-key` header. The `LlmError.raw` field
SHALL contain the upstream's response body only, never request
headers.

#### Scenario: api_key is not in any LlmError message or raw payload

- **WHEN** the LlmClient is invoked with a known
  `apiKey = "sk-test-secret"`
- **AND** the upstream returns 500
- **THEN** the thrown `LlmError.message` does not contain the
  string `"sk-test-secret"`
- **AND** the thrown `LlmError.raw` does not contain the string
  `"sk-test-secret"`

#### Scenario: rate limit is classified

- **WHEN** the upstream returns HTTP 429
- **THEN** the thrown `LlmError.kind === "rate_limited"`

### Requirement: provider HTTP calls have a bounded timeout

Every LlmClient `complete` call SHALL use an
`AbortSignal.timeout` of at most 60 seconds. On timeout the client
SHALL throw an `LlmError` with `kind: "network"` and `message`
including the string `"timeout"`.

#### Scenario: timeout is enforced

- **WHEN** the upstream takes longer than 60s to respond
- **THEN** the LlmClient throws an `LlmError` with
  `kind: "network"` within 65 seconds
- **AND** the chat service returns 502 to the HTTP client

### Requirement: the api_key is read from the llm_providers row, never from the request body

The chat service SHALL resolve the `apiKey` exclusively by looking
up the matching `llm_providers` row at request time. The HTTP
request body SHALL NOT contain any `api_key` field, and the LLM
client SHALL NOT accept one. No endpoint SHALL echo a plaintext
`api_key` in any response body.

#### Scenario: api_key is not accepted from the client

- **WHEN** any chat endpoint is called
- **THEN** no request body is read for an `api_key` field

#### Scenario: api_key is not in any response

- **WHEN** any chat endpoint returns success
- **THEN** the response body does not contain a key matching the
  shape of an `api_key` for any registered provider

### Requirement: chat endpoints return JSON `{ "error": string }` on failure

Every error response from `/api/chats/*` SHALL be JSON with a
single `error` string field. Status codes SHALL be:

- 400 — validation (missing field, bad `provider_model`, empty
  body for PATCH, empty content)
- 401 — `requireAuth` failure
- 404 — chat not found or not owned by the caller
- 409 — (reserved; v1 does not produce any chat-level 409)
- 502 — upstream LLM failure; the response body is
  `{ "error": "Upstream LLM failed: <kind>",
  "chat": { ...chat with the user message persisted } }` so the
  client can resync

#### Scenario: 400 body shape

- **WHEN** any chat endpoint returns 400
- **THEN** the response Content-Type is `application/json`
- **AND** the body parses to an object with a single `error`
  string

#### Scenario: 502 includes the partially-updated chat

- **WHEN** a `POST /api/chats/:id/messages` request fails at the
  LLM dispatch
- **THEN** the response status is 502
- **AND** the response body has `error` describing the failure
  kind
- **AND** the response body has `chat` with the chat row plus
  the user message that was just persisted
