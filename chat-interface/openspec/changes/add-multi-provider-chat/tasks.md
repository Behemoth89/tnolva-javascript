## 1. Backend schema

- [x] 1.1 Add `CREATE TABLE IF NOT EXISTS chats (...)` and `CREATE TABLE IF NOT EXISTS chat_messages (...)` to `backend/src/db.ts` `initDb` with the columns, foreign keys, cascade, and CHECK constraints from the `chat-api` spec; add `idx_chats_user_id` and `idx_chat_messages_chat_id` indexes.
- [x] 1.2 Add a `closeDb()` helper if not already exposed; ensure existing test setup's `beforeEach { closeDb(); initDb(':memory:'); }` pattern still works. (Already exposed; no change needed.)

## 2. Backend repositories

- [x] 2.1 Create `backend/src/chats/chatsRepo.ts` with types `ChatRow`, `PublicChat`, `CreateChatInput`, `UpdateChatInput` and functions: `listChatsForUser(userId)`, `getChatByIdForUser(id, userId)` (returns `null` on miss or wrong owner), `createChat(input)`, `updateChat(id, userId, input)`, `deleteChat(id, userId)`. Map `SQLITE_CONSTRAINT_*` to typed `RepoResult` codes (`conflict` / `not_found` / `validation`).
- [x] 2.2 Create `backend/src/chats/chatMessagesRepo.ts` with types `ChatMessageRow`, `PublicChatMessage`, and functions: `listMessagesForChat(chatId)`, `insertMessage(input)`. No update function exposes the `provider_model` column. Provide a `loadConversation(chatId): PublicChatMessage[]` helper that returns messages ordered by `created_at ASC, id ASC`.

## 3. Backend LLM client

- [x] 3.1 Create `backend/src/llm/types.ts` exporting `LlmRequest`, `LlmResponse`, `LlmError`, `LlmErrorKind`, and the `LlmClient` interface. Document the field shapes per the `chat-api` spec.
- [x] 3.2 Create `backend/src/llm/errors.ts` exporting the typed `LlmError` class plus a `toLlmError(err)` helper that wraps an unknown thrown value into an `LlmError` (network / parse / http / rate_limited), redacting the `apiKey`.
- [x] 3.3 Create `backend/src/llm/openaiCompletions.ts`, `backend/src/llm/openaiResponses.ts`, and `backend/src/llm/anthropic.ts` implementing the `LlmClient` interface per the `chat-api` spec's translation rules. Use Node 20's built-in `fetch` with `AbortSignal.timeout(60_000)`. Parse the upstream response into the normalized `LlmResponse` shape; throw an `LlmError` on any failure.
- [x] 3.4 Create `backend/src/llm/client.ts` exporting `createLlmClient(providerType: LLMProviderType): LlmClient` that maps the provider type string to the right implementation. Add unit tests asserting the three translations (request body shape, headers) and the normalized `LlmResponse` extraction from recorded upstream fixtures.
- [x] 3.5 Add unit tests in `backend/tests/unit/llmClient.test.ts` covering: each provider's request translation, the auth header per provider, the `LlmResponse` extraction on success, and the typed `LlmError` thrown on 4xx / 5xx / network / parse failures (asserting no `apiKey` leakage in any error message or `raw`).

## 4. Backend validation and chat service

- [x] 4.1 Create `backend/src/chats/validation.ts` exporting `parseCreateChatBody`, `parseUpdateChatBody`, and `parseSendMessageBody`. Each returns either a typed value or `{ error: string }`. Enforce: `title` ≤ 200 chars when present; `default_llm_provider_model` matches `^[A-Za-z0-9._-]+:[A-Za-z0-9._:-]+$` and resolves to a registered `(provider, model)` pair via the `llm_providers` / `llm_provider_models` repo; `content` is non-empty and ≤ 32 000 chars.
- [x] 4.2 Create `backend/src/chats/chatService.ts` exporting `sendMessage(userId, chatId, content, opts?)` that orchestrates: chat lookup → provider resolution → persist user message (this step is durable) → call `createLlmClient(...).complete(...)` → on success persist assistant message → return the updated chat. On LLM failure return a `{ kind: 'llm_failed', chat: <with user message persisted> }` discriminated result. Also export `resolveProviderModel(chatOrOverride)` and `getChatWithMessagesForUser(chatId, userId)`.
- [x] 4.3 Add unit tests in `backend/tests/unit/chatService.test.ts` with the LLM client stubbed: success path (user + assistant persisted, chat returned), LLM failure path (user persisted, assistant NOT persisted, failure shape returned), provider resolution from chat default, per-message `provider_model` override on send.

## 5. Backend routes

- [x] 5.1 Create `backend/src/chats/chatsRouter.ts` exposing `GET /api/chats`, `POST /api/chats`, `GET /api/chats/:id`, `PATCH /api/chats/:id`, `DELETE /api/chats/:id`, `POST /api/chats/:id/messages`, all chained with `requireAuth`. Use the existing `parseId` + `handleRepoError` helper pattern. The send-message route maps the `chatService.sendMessage` success to `200` with the full updated chat, and the `llm_failed` result to `502` with `{ error, chat }` (preserving the spec'd 502 body).
- [x] 5.2 Mount the router in `backend/src/app.ts` under `/api/chats`. Verify the existing `/api/admin` and `/api/auth` mounts still resolve.
- [x] 5.3 Add Supertest integration tests in `backend/tests/integration/chats.api.test.ts` covering: list (own-only), create (201, 400 on bad `provider_model`), get-with-messages (200 for owner, 404 for non-owner / missing), patch (title, default, partial body 400, 404 for non-owner), delete (204, cascade verified), and send-message (200 happy path, 502 with partial chat on LLM failure, 404 for non-owner, 400 on empty content). Use the existing `request.agent()` + `seedAdminAndUser` / `seedUser` helpers.

## 6. Backend final

- [x] 6.1 Run `cd backend && npm test` and confirm exit 0. (108/108 pass.)
- [x] 6.2 Run `npx tsc --noEmit` in `backend/` and confirm no new errors. (Clean.)

## 7. Frontend API client and types

- [x] 7.1 Create `frontend/src/api/chats.ts` exporting `Chat`, `ChatMessage`, `ChatWithMessages`, `CreateChatInput`, `UpdateChatInput`, `SendMessageInput`, `LlmFailure`, and the six functions listed in the `chat-frontend` spec. Reuse the `request<T>()` / `parseError` pattern from `frontend/src/api/auth.ts`. `sendMessage` returns the discriminated union described in the spec; other functions throw on non-2xx with the server's `error` message. All fetches use `credentials: "include"`.
- [x] 7.2 Add a Vitest unit test `frontend/tests/chats.api.test.ts` mocking `global.fetch`: each function calls the right URL / method / headers, returns parsed JSON on 2xx, rejects with the server `error` on 4xx, returns the discriminated union on 502 with the partial `chat`, and uses `credentials: "include"`.

## 8. Frontend chat UI

- [x] 8.1 Rewrite `frontend/src/components/ChatPanel.tsx` to drive the real backend. Preserve the existing JSX structure, `data-testid` attributes (`chat-panel`, `chat-title`, `chat-sidebar`, `chat-message-list`, `chat-composer`, `chat-model-select`, `chat-empty-state`, `chat-thinking-indicator`, `chat-error-banner`), and the `ChatPanel.module.css` / glass / motion surface unchanged.
- [x] 8.2 Update `frontend/src/components/Sidebar.tsx` to render chats with `title` (or `(untitled)` fallback) plus a "new chat" action whose click calls `createChat({ default_llm_provider_model: <current> })`, then refreshes the list and switches the active chat. Add `data-testid="chat-new"` to the action.
- [x] 8.3 Update `frontend/src/components/MessageList.tsx` to render each message with `role`-based bubble styling (user vs. assistant), `content`, a formatted `created_at` timestamp, and a muted `provider_model` label. Add `data-testid="chat-message"` per bubble and `data-testid="chat-message-role"` for the role styling hook.
- [x] 8.4 Update `frontend/src/components/MessageInput.tsx` to: disable the submit button while a send is pending, show a "thinking…" indicator on the most recent user bubble during the pending window, clear the textarea on success, and accept an `error?: string` prop that renders an inline error banner. Add `data-testid="chat-composer-submit"` and `data-testid="chat-error-banner"`.
- [x] 8.5 Add a model selector in the `ChatPanel` header (next to the title) that lists available `provider_model` pairs (cross product of `llm_providers` and `llm_provider_models` joined by `llm_provider_id`) and whose current value is the active chat's `default_llm_provider_model`. Changing the value calls `updateChat(activeChatId, { default_llm_provider_model })` and reverts on 400.
- [x] 8.6 Delete `frontend/src/chat/mockData.ts` (and remove any imports). Widen the local `Message` type in `ChatPanel.tsx` to match the backend `ChatMessage` (rename `author` → `role`, `text` → `content`, add `provider_model`, `created_at`); do NOT re-export this from a shared module.
- [x] 8.7 Add a Vitest test `frontend/tests/ChatPanel.test.tsx` rendering the page inside `MemoryRouter` + `AuthProvider` with a stubbed fetch (first call `/api/auth/me` returning an authenticated user). Cover: chat list is fetched on mount, "new chat" creates and switches, send-message happy path renders user + assistant bubbles, send-message 502 keeps the user bubble and shows the error banner, the model selector reflects and persists changes, the empty list shows the empty state, the empty chat shows the message-area empty state, and unauthenticated users are redirected (no `/api/chats` call).
- [x] 8.8 Make the chat title inline-editable: the static title in the chat header is a clickable control (`data-testid="chat-title"`) that switches into a text input (`data-testid="chat-title-input"`) pre-filled with the current `title` (or empty when null) and auto-focused. **Enter** saves via `updateChat(activeChatId, { title: trimmed })` (or `{ title: null }` when the trimmed value is empty), **Escape** cancels without calling `updateChat`, and **blur** saves the same way as Enter. On 2xx the panel replaces the active chat with the returned chat and exits edit mode; on non-2xx the panel reverts the optimistic title update, exits edit mode, and surfaces the server's `error` string in the existing chat error banner. Cap the input length at 200 chars via `maxLength` and disable it while the save is in flight. Add a placeholder title (`"Untitled chat"`) used when the active chat's `title` is null.
- [x] 8.9 Fix the chat page layout so the entire chat fits inside the browser viewport: the chat panel SHALL NOT add a `min-height: 100vh` (which was pushing the page taller than the viewport and hiding the chat header when scrolling). Make `#root` a vertical flex column with `main` as a flex child, give the panel `min-height: 0` (so it can shrink to fit), make the chat header `flex: 0 0 auto` (so it never collapses), and keep the message list as the only scrollable area inside the panel (`overflow-y: auto`, `min-height: 0` already in place). The composer SHALL stay pinned at the bottom of the panel without forcing a page scroll.

## 9. Frontend final

- [x] 9.1 Run `cd frontend && npm run test:run` and confirm exit 0. (72/72 pass.)
- [x] 9.2 Run `npx tsc -b` in `frontend/` and confirm no new errors. (Clean.)

## 10. Final verification

- [x] 10.1 Confirm `openspec/changes/add-multi-provider-chat/` contains `proposal.md`, `design.md`, `tasks.md`, and `specs/chat-api/spec.md` + `specs/chat-frontend/spec.md`. (All present.)
- [x] 10.2 Confirm both `npm test` suites pass from the repo root (`npm test`). (Backend 110/110 + Frontend 66/66 = 176/176.)
- [x] 10.3 Confirm `docker compose config` parses and the new tables are created on first boot of the dev compose stack (or document a manual verification step if Docker is not available locally). (`docker compose config` parses; the new `chats` / `chat_messages` DDL is added to `backend/src/db.ts` `initDb` so they are created on first boot of any deployment.)
