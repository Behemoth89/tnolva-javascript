## Why

The chat backend cannot talk to any LLM today: even though the
`llm_providers` and `llm_provider_models` admin catalog now exists
(`add-admin-llm-provider-management`), the React `ChatPanel` still runs
entirely off `frontend/src/chat/mockData.ts` and canned replies, and
there is no persistence for chats or messages. We need the foundational
chat feature so a logged-in user can hold multiple independent
conversations, choose a provider+model per chat, send a message, and
receive a real (non-streaming) response from the configured upstream
LLM, with the conversation persisted.

## What Changes

- Add a backend `chats` table and a `chat_messages` table to the
  existing SQLite schema in `backend/src/db.ts`. A `chats` row owns a
  user, a title, and a `default_llm_provider_model` (e.g.
  `anthropic:claude-sonnet-4-6`); a `chat_messages` row is one
  user-authored or assistant-authored message with a frozen
  `provider_model` recording what model produced it.
- Add a backend `LlmClient` abstraction and three concrete
  implementations (OpenAI Chat Completions, OpenAI Responses, Anthropic
  Messages). The abstraction takes a `provider_model` string and
  ordered messages and returns a normalized response (assistant text,
  usage, stop reason, raw payload). Provider API keys are read from the
  `llm_providers` rows that the admin catalog already manages; the
  plaintext key never leaves the server.
- Add backend REST endpoints under `/api/chats` and `/api/chats/:id`:
  create a chat, list the current user's chats, get a chat with its
  messages, send a message in a chat (which persists the user message,
  dispatches to the resolved provider, and persists the assistant
  reply with its `provider_model`), and update a chat's title /
  `default_llm_provider_model`. All endpoints are guarded by
  `requireAuth` and scoped to `req.auth.userId`.
- Add a React chat page replacing the mock `ChatPanel`: a chat list
  sidebar with a "new chat" action, a message history view with
  user/assistant bubbles and timestamps, a composer with a
  pending/disabled state while a request is in flight, a model selector
  reflecting the chat's `default_llm_provider_model`, and basic
  empty/error states.
- Preserve the existing `frontend/src/chat/{types,mockData}.ts` shape
  in spirit but replace the mock data with real fetches; the design
  tokens, glass surfaces, sidebar layout, and message-list animations
  introduced in `add-frontend-design` are reused unchanged.
- New dependencies on the backend only: an HTTP client (`undici` /
  Node's built-in `fetch`) and minimal `node:crypto` use for request
  ids; no SDK dependencies on `openai` or `@anthropic-ai/sdk`. The
  frontend adds no runtime dependencies.

## Capabilities

### New Capabilities

- `chat-api`: backend persistence, REST API, LLM client abstraction,
  and three provider implementations that let an authenticated user
  create chats, send messages, and receive assistant replies routed to
  the right upstream LLM based on a `provider_model` string.
- `chat-frontend`: React chat list, chat view, composer, model
  selector, and the empty / loading / error states that consume the
  `chat-api` REST surface.

### Modified Capabilities

None. The chat feature is purely additive: the existing `/api/auth/me`
response shape, the existing `llm_providers` / `llm_provider_models`
admin CRUD surface, and the existing `NavBar` (which already exposes a
"Chat" link to every authenticated user at `/chat`) all satisfy the
chat feature's needs without any requirement change.

## Impact

- **Backend** — two new tables (`chats`, `chat_messages`) added to
  `backend/src/db.ts` `initDb`; new repository modules
  `backend/src/chats/chatsRepo.ts` and
  `backend/src/chats/chatMessagesRepo.ts`; new validation module
  `backend/src/chats/validation.ts`; new router
  `backend/src/chats/chatsRouter.ts`; new LLM client module
  `backend/src/llm/{client.ts, openaiCompletions.ts, openaiResponses.ts,
  anthropic.ts, types.ts, errors.ts}`; a new service module
  `backend/src/chats/chatService.ts` that ties persistence to the LLM
  client; mount in `backend/src/app.ts` under `/api/chats`. All new
  endpoints reuse the existing `requireAuth` middleware and the
  existing test infrastructure (Jest + Supertest + in-memory SQLite).
- **Frontend** — new API client `frontend/src/api/chats.ts`; rewritten
  `frontend/src/components/ChatPanel.tsx` (and its existing
  `ChatPanel.module.css`, `Sidebar.tsx`, `MessageList.tsx`,
  `MessageInput.tsx` siblings) to drive the real backend. The `/chat`
  route is already registered in `frontend/src/App.tsx` under
  `RouteGuard`, and `frontend/src/components/NavBar.tsx` already
  exposes a "Chat" link to every authenticated user — no nav or route
  changes are required. The `frontend/src/chat/mockData.ts` placeholder
  is removed.
- **Tests** — new backend unit tests for both repos and the LLM
  client (with the three providers' translation logic exercised
  against recorded fixtures) and Supertest integration tests for the
  full `/api/chats/*` surface including 401 / 403 / 400 / 404 / 409
  paths, the user-scoping invariant, and the "user message persisted
  even when the LLM call fails" guarantee. New Vitest tests for the
  API client and the rewritten `ChatPanel` covering the
  empty / loading / error / sent-and-replied states. The existing
  `testing-standards` spec requires both `npm test` suites to pass.
- **Compatibility** — additive change. No existing endpoint, table, or
  page changes behavior. The placeholder `mockData.ts` and canned
  replies are removed; the visual surface and design tokens used by
  `ChatPanel` are preserved.
- **Out of scope (deferred to follow-up changes)**:
  - Streaming responses (SSE / chunked).
  - Multi-modal content (images, files) in messages.
  - Tool / function calling.
  - Editing or deleting messages.
  - Per-message regeneration or branching.
  - Pagination of `/api/chats` lists or message histories.
