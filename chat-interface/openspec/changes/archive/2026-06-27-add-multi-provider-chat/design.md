## Context

The chat-interface repo (`C:\Kool\tnolva-javascript\chat-interface`) is a
Node 20 / Express 4 + React 18 / Vite + SQLite (via `better-sqlite3`)
full-stack app shipped via Docker Compose. The auth and admin slices are
already in place: session cookies via `express-session` + a SQLite
store, `requireAuth` / `requireAdmin` middleware, the React
`AuthContext`, the `RouteGuard` pattern, and a full admin CRUD for
`llm_providers` / `llm_provider_models` that stores provider rows
(name, url, api_key, type) and the models each provider exposes
(`add-admin-llm-provider-management`, 28/28 tasks complete).

What is missing is the **chat itself**. The React `ChatPanel`
(`frontend/src/components/ChatPanel.tsx`) and its sidebar / message
list / input all read from `frontend/src/chat/mockData.ts`, dispatch
no network calls, and synthesize assistant replies with `setTimeout`
plus a canned array. There is no `chats` table, no `chat_messages`
table, no chat router, no chat API client on the frontend, and no
outbound HTTP to any upstream LLM. A `db.md` design doc sketches a
future schema with `CHAT` / `MESSAGE` / `PROJECT` tables, but it is
explicitly aspirational; the actual current schema is in
`backend/src/db.ts` and consists of `users`, `llm_providers`, and
`llm_provider_models`.

This change lands the **foundational chat feature**: persistence for
chats and messages, a provider-agnostic LLM client that fronts OpenAI
Chat Completions, OpenAI Responses, and Anthropic Messages, a REST
surface that wires the two together with proper error handling, and
the React UI that consumes it. The result: a logged-in user can create
a chat, switch its default model, send a message, and receive a real
response from the configured upstream — all in request/response mode
(no streaming yet, deferred to a follow-up).

## Goals / Non-Goals

**Goals:**

- Persist chats and messages in SQLite with referential integrity
  (user → chats → messages, cascade delete on user and on chat).
- Freeze each message's `provider_model` at write time so changing a
  chat's default never rewrites history.
- Define a single internal `LlmClient` interface and ship three
  implementations (OpenAI Chat Completions, OpenAI Responses, Anthropic
  Messages). The rest of the app depends only on the interface, not on
  any provider SDK.
- Read provider config (including the plaintext `api_key`) at request
  time from the existing `llm_providers` / `llm_provider_models` rows;
  the key never leaves the server, never appears in logs, and is never
  serialized into any HTTP response.
- Expose REST endpoints under `/api/chats` and `/api/chats/:id`,
  guarded by `requireAuth` and scoped to `req.auth.userId`. On LLM
  failure the user's message is still persisted and a clean 502 is
  returned to the client.
- Rewrite the React `ChatPanel` to drive the real backend, preserve
  the existing visual surface (sidebar, message bubbles, glass effect,
  motion), and add a model selector that reflects the chat's
  `default_llm_provider_model`.
- Cover the new behavior with unit + Supertest integration tests on
  the backend (including the three provider translations) and Vitest
  component / API tests on the frontend; both `npm test` suites stay
  green.

**Non-Goals:**

- Streaming responses (SSE / chunked) — deferred to a follow-up change.
- Multi-modal content (images / files) in messages.
- Tool / function calling, structured output / JSON mode.
- Editing or deleting messages, or regenerating an assistant reply.
- Per-message branching / alternate replies.
- Pagination of `/api/chats` lists or message histories.
- Encryption-at-rest for the plaintext `api_key` (already documented
  as a follow-up in `llm-provider-admin`).
- Audit logging of LLM calls beyond the response payload captured
  in-process for the assistant message.
- Bringing the `db.md` `PROJECT` table into scope.

## Decisions

### Decision: Co-locate the new chat module under `backend/src/chats/`

The chat feature is a single logical capability that spans
persistence, validation, routing, and a service layer that ties the
LLM client to the chat/message repos. Following the layout used by
`backend/src/auth/` and `backend/src/admin/`, we create
`backend/src/chats/` with `chatsRepo.ts`, `chatMessagesRepo.ts`,
`validation.ts`, `chatsRouter.ts`, and `chatService.ts`. The router
is mounted in `backend/src/app.ts` under `/api/chats`. This keeps
file paths predictable and matches the existing convention.

**Alternatives considered:**

- *Split persistence and dispatch into two folders (`chats/` and
  `llm/`).* Rejected for v1: the only consumer of the LLM client is
  the chat service, and the dispatch layer is small enough that
  colocating avoids premature splitting. The LLM client lives in
  `backend/src/llm/` because the three provider implementations are
  shared plumbing, not chat-specific.

### Decision: New tables `chats` and `chat_messages`; messages hold a frozen `provider_model`

`chats` columns: `id INTEGER PK AUTOINCREMENT`, `user_id INTEGER NOT
NULL REFERENCES users(id) ON DELETE CASCADE`, `title TEXT`, and
`default_llm_provider_model TEXT NOT NULL`, plus `created_at
DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`. `chat_messages`
columns: `id INTEGER PK AUTOINCREMENT`, `chat_id INTEGER NOT NULL
REFERENCES chats(id) ON DELETE CASCADE`, `role TEXT NOT NULL CHECK
(role IN ('user','assistant'))`, `content TEXT NOT NULL`,
`provider_model TEXT NOT NULL`, plus `created_at DATETIME NOT NULL
DEFAULT CURRENT_TIMESTAMP`. Indexes on `chats.user_id` and
`chat_messages.chat_id` keep list / history queries cheap.

The `provider_model` is written at insert time and never updated
(the repo does not expose any update that touches this column). The
chat's `default_llm_provider_model` is a separate column that can
change freely; the conversation history therefore records *what
actually ran* for each assistant reply.

**Alternatives considered:**

- *Store messages as a JSON blob on the chat row.* Rejected: the spec
  requires ordered, addressable messages with per-message
  `provider_model`, and the existing pattern is one row per record.
- *Allow `role` to include `system` and `tool` now.* Rejected as
  out of scope; the CHECK constraint can be widened in a follow-up
  if / when tool calling lands.
- *Derive a message's `provider_model` from the chat at read time
  rather than freezing it.* Rejected: the whole point of the field
  is to record what was actually used; deriving it would let a
  history rewrite itself when the default changes.

### Decision: `provider_model` is an opaque string of the form `<provider>:<model>`

Examples: `anthropic:claude-sonnet-4-6`, `openai:gpt-5.5`,
`openai-responses:gpt-5.5`. The provider portion is matched against
the `llm_providers.name` column (the same name shown in the admin
CRUD). The model portion is matched against
`llm_provider_models.name` *scoped to that provider*. Together they
uniquely identify a configured provider+model pair. The validation
layer enforces the `^<provider>:<model>$` shape, and the service
layer does the lookup against the catalog rows. If the lookup fails
the request is rejected with a clean 400, not a 500 — a bad
`provider_model` is a user / API error.

This keeps the abstraction **open for new providers** without
schema changes: a future `google:gemini-2.5-pro` is added by
registering a new `llm_providers` row of the appropriate type (or
even a new type if the API shape differs) and shipping one more
`LlmClient` implementation. No chat, message, or admin CRUD code
changes.

**Alternatives considered:**

- *Use a structured `{ provider_id, model_id }` pair.* Rejected for
  v1: the public API is a string (matches the `db.md` design
  language and is easier to read in URLs / logs), and the repo
  resolves the pair server-side. Storing it as the string also
  matches the spec wording.
- *Hardcode the provider list at the API boundary.* Rejected: the
  whole point of the `llm_providers` admin catalog is that the set
  is data-driven.

### Decision: An internal `LlmClient` interface normalizes the three provider shapes

`backend/src/llm/types.ts` defines the request and response shapes:

```ts
export interface LlmRequest {
  model: string;                       // e.g. "claude-sonnet-4-6"
  system?: string;                     // optional system prompt
  messages: ReadonlyArray<{ role: 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  // future: tools, response_format, etc.
}

export interface LlmResponse {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_use' | 'error' | 'unknown';
  raw: unknown;                        // the provider's parsed JSON, for debugging
}
```

`backend/src/llm/client.ts` exports `interface LlmClient` with
`complete(req: LlmRequest, ctx: { url: string; apiKey: string }):
Promise<LlmResponse>` and a `createLlmClient(providerType: string):
LlmClient` factory that maps `LLMProviderType` strings
(`openai_completions` | `openai_responses` | `anthropic`) to the
right implementation. Each implementation:

- Translates the ordered `messages` and optional `system` into the
  provider's expected body (Chat Completions `messages[]` with a
  leading `{role:'system'}` entry, Responses `input[]` plus top-level
  `instructions`, Anthropic `messages[]` plus top-level `system`).
- POSTs to the configured `url` with the configured `apiKey` as a
  bearer / `x-api-key` header.
- Parses the response, extracts the assistant text, normalizes
  usage, and returns `{ text, usage, finishReason, raw }`.
- Throws a typed `LlmError` (`{ kind: 'http' | 'network' | 'parse' |
  'rate_limited', status?, message, raw? }`) on failure so the chat
  service can decide how to surface it to the client.

The chat service calls the factory once per request, never holds
provider state, and never branches on provider type after
construction.

**Alternatives considered:**

- *Adopt the `openai` and `@anthropic-ai/sdk` packages.* Rejected:
  adds two SDK dependencies and a client each that has its own
  retry / timeout semantics; the three provider shapes diverge
  enough that we end up with two code paths anyway. A small
  hand-written adapter per provider is ~80-120 lines and gives us
  one timeout / one error shape / one `AbortSignal` per request.
- *Stream responses.* Deferred to a follow-up; the v1 surface is
  request/response only.
- *Bake provider routing into the chat service.* Rejected: keeping
  it in a factory makes adding a fourth provider a one-file change
  and keeps the chat service free of provider branching.

### Decision: No SSE; request/response only, with a per-request timeout

Every call from the chat service to the LLM client uses
`AbortSignal.timeout(60_000)` (60s default, overridable in tests).
The HTTP client is Node 20's built-in `fetch`. On timeout /
network / HTTP error the service catches the typed `LlmError`,
rolls forward with the user message already persisted, and returns
`502 { error: "Upstream LLM failed: <kind>" }` to the HTTP client.
The user message is **never rolled back** — losing the user's text
on a transient provider failure is a worse UX than showing an
error toast.

**Alternatives considered:**

- *Roll back the user message on failure.* Rejected: the spec is
  explicit that the user message must be preserved.
- *Queue retries inside the service.* Rejected for v1: out of
  scope, and a single synchronous retry can be added at the LLM
  client layer later without changing the chat service's contract.

### Decision: Service layer owns the send-message flow

`backend/src/chats/chatService.ts` exposes a small set of
orchestration functions used by the router. `sendMessage(userId,
chatId, content, opts?)` does, in order:

1. `getChatByIdForUser(chatId, userId)` — 404 if not found, 403 if
   it belongs to a different user.
2. `validateProviderModel(providerModel)` — 400 if the string is
   malformed.
3. `resolveProvider(providerModel)` — look up the `llm_providers`
   row by name and the `llm_provider_models` row by
   `(provider_id, name)`. 400 if either is missing.
4. `insertMessage({ chat_id, role: 'user', content,
   provider_model })` — the user message is now durable.
5. `loadConversation(chatId)` — read the chat's full ordered
   message history.
6. `createLlmClient(provider.type).complete({...}, { url, apiKey })`
   — dispatch. On success capture the assistant text and the
   `provider_model`; on failure still capture the provider_model
   that was attempted (so the audit trail is intact) and persist
   the assistant message with `role='assistant'`, `content=<error
   text>`, and a sentinel `finishReason` so the frontend can
   render an error bubble.
7. `getChatWithMessages(chatId, userId)` — return the full
   updated state.

Wait, the design above is one option. The cleaner one is the spec
choice: **on provider failure, the assistant message is *not*
persisted** and the API returns 502 with the user message already
in the DB. This keeps the message history honest — every assistant
message in storage is a real reply, not an error placeholder. The
frontend re-fetches the chat, sees the user message plus no
assistant message, and shows an error state on the bubble. This is
the contract; the spec captures it.

**Alternatives considered:**

- *Persist an assistant error placeholder.* Rejected: pollutes
  history with non-replies; complicates "what did the model say"
  queries; the spec's "user message persists on failure" is
  satisfied either way.
- *Inline the dispatch in the router.* Rejected: the router stays
  thin; service holds orchestration and error mapping.

### Decision: Frontend replaces the mock `ChatPanel` while keeping the visual surface

`frontend/src/components/ChatPanel.tsx` is rewritten to:

- Fetch `GET /api/chats` on mount, render the chat list in the
  existing `Sidebar`; the "new chat" action calls
  `POST /api/chats` and switches to the new chat's id.
- Fetch `GET /api/chats/:id` whenever the active chat changes,
  rendering messages via the existing `MessageList`; each bubble
  shows the author and a `created_at` timestamp.
- The composer calls `POST /api/chats/:id/messages` and shows a
  disabled / "thinking…" state via the existing
  `MessageInput.disabled` / `pending` props; on success the new
  message list is rendered; on failure the bubble is marked as
  errored and a retry control re-sends the last user message.
- A model selector (in the header next to the chat title) lets the
  user change `default_llm_provider_model` via
  `PATCH /api/chats/:id` and re-renders the title / model label.
- Each message bubble shows its `provider_model` as a small muted
  label (e.g. `anthropic:claude-sonnet-4-6`) for transparency.
- `frontend/src/chat/mockData.ts` is deleted; the placeholder
  `Message` type is widened to match the backend response
  (`author` becomes `role`, `text` becomes `content`, and the
  `created_at` / `provider_model` fields are added).
- The existing `ChatPanel.module.css`, glass surfaces, and motion
  classes are reused unchanged.

**Alternatives considered:**

- *Build a brand-new `Chat` page from scratch.* Rejected: the
  existing `ChatPanel` already implements the sidebar / list /
  composer / glass / motion design correctly; rewriting the
  component but keeping the CSS gives the user-visible result
  unchanged while the data layer becomes real.
- *Use TanStack Query for cache + refetch.* Rejected for v1: no
  precedent in the repo; per-component `useEffect` + `refresh`
  matches every other page in the codebase.

### Decision: PATCH for chat metadata, POST for messages

The HTTP surface mirrors REST conventions and the existing admin
CRUD:

```
GET    /api/chats                  list current user's chats
POST   /api/chats                  create a chat
GET    /api/chats/:id              get a chat with its messages
PATCH  /api/chats/:id              update title and/or default_llm_provider_model
DELETE /api/chats/:id              delete a chat (and its messages via cascade)
POST   /api/chats/:id/messages     send a message; triggers LLM dispatch
```

`PATCH` (not `PUT`) because only `title` and
`default_llm_provider_model` are user-editable and both are
optional; the body is `{ title?, default_llm_provider_model? }` with
at least one field present. `POST /api/chats/:id/messages` takes
`{ content: string, provider_model?: string }` and returns the full
updated chat (with the freshly-persisted user + assistant messages)
so the frontend can replace local state in one call.

**Alternatives considered:**

- *PUT for chat updates.* Rejected: PUT with partial body is
  awkward; PATCH with at-least-one-field validation is the same
  convention the admin CRUD already uses.
- *Return only the new messages from `POST .../messages`.* Rejected:
  the spec calls out returning "the updated message list"; one
  round-trip is simpler for the frontend.

## Risks / Trade-offs

- **[Plaintext `api_key` in SQLite]** → The key lives in the
  `llm_providers` row, is read at request time, and is never logged
  or returned. Encryption-at-rest is documented as a follow-up in
  `llm-provider-admin`. Mitigation: the LLM client takes the key
  via a context object and never logs it; a unit test asserts that
  the api_key does not appear in `console.error` output or in
  `LlmResponse.raw` (only the response payload, no auth headers).
- **[Bad `provider_model` reaches the service]** → Mitigation:
  validation rejects malformed strings with 400; the service does
  a `llm_providers` + `llm_provider_models` lookup and returns
  400 with a specific error if the pair is not registered. The
  admin CRUD flow is the only legitimate way to add a model.
- **[LLM call latency blocks the request thread]** → Node 20 +
  `better-sqlite3` runs the DB call on the main loop; an LLM call
  is async and does not block other requests, but the user's
  browser is held for up to 60s. Mitigation: 60s timeout via
  `AbortSignal.timeout`; the frontend shows a "thinking…" state;
  streaming is the long-term fix and is explicitly deferred.
- **[Cascade delete removes all messages on chat delete]** →
  Acceptable for v1: matches the simplicity of the rest of the
  schema. The frontend does not currently expose a delete chat
  control, but the API supports it; surfacing the control is a
  follow-up.
- **[Provider SDK not used]** → Hand-written adapters must be
  kept in sync with each provider's API. Mitigation: each
  adapter is small (~80-120 lines) and the response shape is
  fixture-tested against recorded provider responses.
- **[Three provider types, one dispatch]** → If a future
  `google:gemini-2.5-pro` arrives with a different request shape
  we add a new `LLMProviderType` enum value and one new adapter
  file; chat / message persistence and the API routes are
  unchanged.

## Migration Plan

The change is additive and idempotent:

1. Deploy the backend with the new tables, router, and LLM client
   wired into the service. `CREATE TABLE IF NOT EXISTS` upgrades
   the existing database in place; `foreign_keys = ON` is already
   set in `initDb`, so the cascade is honored.
2. Deploy the frontend with the rewritten `ChatPanel`, the new
   API client, and the deleted `mockData.ts`. The existing visual
   surface is preserved.
3. Rollback: redeploy the previous backend (the new tables remain
   unused and harmless) and the previous frontend (the mock
   chat is back). No data loss either direction; if desired,
   drop the new tables with
   `DROP TABLE chat_messages; DROP TABLE chats;`.

## Open Questions

- **Title generation**: should the backend auto-generate a chat
  title from the first user message (e.g. truncated, ellipsized)
  if the title is null at send time, or always require the
  client to set it? The proposal defers this to the chat service
  with a simple "use first 60 chars of first user message"
  fallback; resolved during implementation if the spec needs to
  lock it down.
- **Per-message model override on send**: the spec supports
  `provider_model` on `POST /api/chats/:id/messages` overriding
  the chat's default for that turn. Implementation is a one-line
  branch in `chatService.sendMessage`; spec'd but the UX is
  deferred to a follow-up (no UI for it in v1).
- **429 / rate-limit handling**: if a provider returns 429 we
  surface 502 today. A future change might add a single in-process
  retry with backoff; out of scope here.
