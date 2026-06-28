# chat-frontend Specification

## Purpose

Define the React-side chat experience: a chat list sidebar with a
"new chat" action, a chat view rendering user and assistant messages
with timestamps, a composer that drives a real backend request, a
model selector that reflects the active chat's
`default_llm_provider_model`, and the empty / loading / error states
that wrap the experience. The page consumes the `chat-api` REST
surface and follows the existing per-component `useState` +
`useEffect` + manual `refresh()` pattern used by every other page
in the app (no global cache layer).

## Requirements

### Requirement: chats API client mirrors the backend REST surface

The frontend SHALL provide `frontend/src/api/chats.ts` exporting the
types `Chat`, `ChatMessage`, and the async functions:

- `listChats(): Promise<Chat[]>`
- `createChat(input: { title?: string;
  default_llm_provider_model: string;
  project_id?: number }): Promise<Chat>`
- `getChat(id: number): Promise<ChatWithMessages>`
- `updateChat(id: number, input: { title?: string | null;
  default_llm_provider_model?: string }): Promise<Chat>`
- `deleteChat(id: number): Promise<void>`
- `sendMessage(chatId: number, input: {
  content: string; provider_model?: string }):
  Promise<ChatWithMessages | LlmFailure>`

The `Chat` type SHALL include `project_id: number` and
`project_name: string` (both are populated by the backend per
`chat-api`'s "chat responses include project_id and
project_name" requirement). All `fetch` calls SHALL use
`credentials: "include"`. The `sendMessage` function SHALL
return a discriminated union: `{ ok: true, value:
ChatWithMessages }` on success, or `{ ok: false, error: string,
chat: ChatWithMessages }` on 502 (the partial chat with the user
message persisted), or throw an `Error(serverErrorMessage)` on
any 4xx / 5xx that does not include the 502 shape. All other
functions SHALL throw on non-2xx with the server's `error`
message.

#### Scenario: listChats calls the right URL

- **WHEN** `listChats()` is called
- **THEN** a `GET /api/chats` request is issued
- **AND** the request includes `credentials: "include"`

#### Scenario: createChat with project_id posts the field

- **WHEN** `createChat({ title: "x",
  default_llm_provider_model: "anthropic:claude-sonnet-4-6",
  project_id: 7 })` is called
- **THEN** a `POST` is sent to `/api/chats` with the JSON body
  containing `project_id: 7`

#### Scenario: sendMessage returns the updated chat on success

- **WHEN** `sendMessage(1, { content: "hi" })` is called
- **AND** the server returns 200 with a `ChatWithMessages` body
- **THEN** the resolved value is
  `{ ok: true, value: <ChatWithMessages> }`

#### Scenario: sendMessage surfaces the 502 partial chat

- **WHEN** `sendMessage(1, { content: "hi" })` is called
- **AND** the server returns 502 with
  `{ error: "Upstream LLM failed: http", chat: { ... } }`
- **THEN** the resolved value is
  `{ ok: false, error: "Upstream LLM failed: http",
  chat: { ... } }`
- **AND** no exception is thrown

#### Scenario: sendMessage throws on 4xx

- **WHEN** `sendMessage(1, { content: "" })` is called
- **AND** the server returns 400 with `{ "error": "..." }`
- **THEN** the call rejects with an `Error` whose `.message`
  equals the server's `error` string

### Requirement: ChatPanel renders a chat list with a new-chat action

The frontend SHALL render the `/chat` route as a
`ChatPanel` component (the existing one in
`frontend/src/components/ChatPanel.tsx` is rewritten to drive the
real backend, preserving its CSS module). The panel SHALL contain a
sidebar listing the current user's chats by `title` (falling back
to `(untitled)` when `title` is null) ordered by `created_at
DESC`. The sidebar SHALL include a "new chat" action that, when
clicked, calls `createChat({ default_llm_provider_model:
<currently selected> })`, switches the active chat to the new chat,
and refreshes the list.

#### Scenario: chat list is fetched on mount

- **WHEN** the user navigates to `/chat` and is authenticated
- **THEN** the panel renders
- **AND** `listChats()` is called
- **AND** the sidebar shows the returned chats in the order
  received

#### Scenario: new chat creates and activates

- **WHEN** the user clicks the "new chat" action
- **THEN** `createChat` is called with the current model's
  `default_llm_provider_model`
- **AND** on success the new chat is added to the sidebar
- **AND** the active chat switches to the new chat
- **AND** `getChat(newId)` is called to render the new chat view

#### Scenario: empty list shows an empty state

- **WHEN** `listChats()` returns an empty array
- **THEN** the sidebar shows a "No chats yet" message
- **AND** the "new chat" action is still rendered

### Requirement: ChatPanel renders the active chat's message history

When a chat is active, the panel SHALL render the chat's
`messages` array in `created_at ASC` order. Each message bubble
SHALL show the `content` text, the `role` (user bubble on one
side, assistant bubble on the other, mirroring the existing
`MessageList` styling), the `created_at` timestamp formatted as
a human-readable string, and the `provider_model` as a small
muted label. When the active chat is empty, the message area
SHALL show an empty state.

#### Scenario: messages render in order

- **WHEN** the active chat has three messages
- **THEN** the message list renders exactly those three messages
  in insertion order
- **AND** each bubble shows the message's `content`, `role`
  styling, `created_at`, and `provider_model`

#### Scenario: empty chat shows an empty state

- **WHEN** the active chat has zero messages
- **THEN** the message area renders a "Send a message to start"
  empty state
- **AND** no message bubbles are rendered

### Requirement: chat title is editable inline in the chat header

The chat header SHALL render the active chat's `title` as an
inline-editable control. When the user clicks the title, the panel
SHALL swap the title's `<h1>` for an `<input type="text">` that is
auto-focused and pre-filled with the current `title` (or empty when
`title` is null). Pressing **Enter** in the input SHALL call
`updateChat(activeChatId, { title: trimmed })` with the trimmed
value (or `{ title: null }` when the trimmed value is empty);
pressing **Escape** SHALL cancel without calling `updateChat`; and
blurring the input SHALL also save (same as Enter). On a 2xx
response the panel SHALL replace the active chat with the returned
chat, exit edit mode, and clear the draft. On a non-2xx response
the panel SHALL revert the optimistic title update, exit edit mode,
and surface the server's `error` string in the existing chat error
banner. The title input SHALL cap length at the backend's limit
(200 characters) via `maxLength` and SHALL be disabled while the
save is in flight.

#### Scenario: clicking the title enters edit mode

- **WHEN** the active chat has `title = "Design review"` and the
  user clicks the title
- **THEN** the `<h1>` is replaced by an `<input type="text">`
- **AND** the input's value is `"Design review"`
- **AND** the input has focus

#### Scenario: pressing Enter saves the new title

- **WHEN** the user types `"New name"` in the title input and
  presses **Enter**
- **THEN** `updateChat` is called with
  `{ title: "New name" }`
- **AND** on 2xx the input is replaced by the `<h1>` showing
  `"New name"`
- **AND** the sidebar list also reflects the new title

#### Scenario: pressing Escape cancels without saving

- **WHEN** the user types `"draft"` in the title input and presses
  **Escape**
- **THEN** no `updateChat` request is issued
- **AND** the `<h1>` is restored with the previous title

#### Scenario: clearing the title saves null

- **WHEN** the user clears the title input (empty / whitespace) and
  presses **Enter**
- **THEN** `updateChat` is called with `{ title: null }`
- **AND** on 2xx the `<h1>` shows the empty-title placeholder
  (`"Untitled chat"`)

#### Scenario: failed PATCH reverts and shows the error

- **WHEN** the user types `"x"` in the title input and presses
  **Enter**
- **AND** `updateChat` returns 400
- **THEN** the displayed title reverts to the previous value
- **AND** the chat error banner shows the server's `error` string
- **AND** the input is replaced by the `<h1>` (the panel exits
  edit mode)

### Requirement: ChatPanel layout fills the viewport and only the message list scrolls

The chat page SHALL be laid out so the entire chat experience fits
inside the browser viewport: the top `NavBar` is rendered above the
chat, the chat panel fills the remaining vertical space, the chat
header stays pinned at the top of the panel, the message list
scrolls independently inside the panel, and the composer stays
pinned at the bottom. The chat panel SHALL NOT add a `min-height`
of `100vh` (or any fixed pixel height larger than its available
space) — doing so would force the page itself to scroll and hide
the chat header. The root layout (`#root`, `main`, the chat
panel's outer flex container) SHALL be a vertical flex column so
the available height propagates down to the message list, and the
message list SHALL keep its existing `overflow-y: auto` /
`min-height: 0` so it scrolls inside the panel rather than
expanding it.

#### Scenario: header is visible without scrolling the page

- **WHEN** the chat has more messages than fit in the visible
  message-list area
- **THEN** the page itself does not scroll
- **AND** the message list scrolls inside the panel
- **AND** the chat header (title, model selector, delete button)
  remains visible

#### Scenario: composer is reachable without scrolling the page

- **WHEN** the chat has more messages than fit in the visible
  message-list area
- **THEN** the composer at the bottom of the panel is reachable
  without scrolling the page
- **AND** the page itself does not scroll

### Requirement: composer sends a message and reflects pending / success / error

The composer SHALL call `sendMessage(activeChatId,
{ content })` on submit. While the call is in flight the composer
SHALL be disabled and the panel SHALL show a "thinking…" indicator
on a pending user bubble. On success the panel SHALL replace the
active chat's messages with the returned chat's messages (the user
+ assistant pair). On 502 the panel SHALL keep the user message
visible, mark it as errored, and surface the error text from the
502 response. On any other non-2xx the panel SHALL surface the
server's `error` string.

#### Scenario: happy-path send

- **WHEN** the user submits a non-empty message
- **AND** the server returns 200 with the updated chat
- **THEN** the composer disables for the duration of the call
- **AND** on success the user message and assistant reply appear
  in the message list
- **AND** the composer clears and re-enables

#### Scenario: pending state is shown

- **WHEN** a send is in flight
- **THEN** the composer's submit button is disabled
- **AND** the most recent user bubble shows a "thinking…"
  indicator
- **AND** no second send is allowed while the first is pending

#### Scenario: 502 surfaces an error state

- **WHEN** the server returns 502 with
  `{ error: "Upstream LLM failed: http", chat: { ... } }`
- **THEN** the user message is rendered in the message list
- **AND** the user bubble shows the error string from the
  response
- **AND** the composer clears and re-enables
- **AND** no assistant bubble is rendered for that send

#### Scenario: empty submit is rejected client-side

- **WHEN** the user submits an empty or whitespace-only message
- **THEN** the composer does not call `sendMessage`
- **AND** no pending state is shown

### Requirement: model selector reflects the active chat's default and persists changes

The chat header SHALL display a model selector that lists the
available `provider_model` pairs (the cross product of
`llm_providers` and `llm_provider_models` joined by
`llm_provider_id`) and whose current value is the active chat's
`default_llm_provider_model`. When the user picks a different
model the panel SHALL call
`updateChat(activeChatId, { default_llm_provider_model: <new> })`
and update the displayed value on success.

#### Scenario: selector shows the active chat's model

- **WHEN** the active chat has
  `default_llm_provider_model = "anthropic:claude-sonnet-4-6"`
- **THEN** the selector's displayed value is
  `"anthropic:claude-sonnet-4-6"`

#### Scenario: changing the model persists

- **WHEN** the user picks `"openai:gpt-5.5"` from the selector
- **THEN** `updateChat` is called with
  `{ default_llm_provider_model: "openai:gpt-5.5" }`
- **AND** on success the selector's displayed value updates
- **AND** the next message sent in the chat uses the new
  default
- **AND** historical messages' displayed `provider_model` does
  not change

#### Scenario: invalid model is rejected

- **WHEN** `updateChat` returns 400 (the chosen
  `provider_model` is not in the catalog)
- **THEN** the selector reverts to the previous value
- **AND** the panel surfaces the server's `error` string

### Requirement: ChatPanel is auth-gated and renders the existing visual surface

The `/chat` route SHALL be wrapped in the existing `RouteGuard`;
unauthenticated users are redirected to `/login` and the chat
page never makes an API call. The `ChatPanel` SHALL continue to
use the existing `ChatPanel.module.css`, the existing
`Sidebar`, `MessageList`, and `MessageInput` components (with
data-testids and props updated to match the real types), the
existing design tokens (`tokens.css`, `glass.css`, `motion.css`),
and the existing motion classes (`anim-panel-scale`, etc.). The
title control in the chat header SHALL be a button-styled
`<h1>` (or a `<button>` carrying the same `data-testid="chat-title"`)
that is replaced by a text `<input>` in edit mode; the visual
treatment of the title (font, weight, alignment) SHALL match the
previous static-title look in both states. The `frontend/src/chat/mockData.ts`
placeholder SHALL be removed and no `cannedReplies` /
`pickCannedReply` code SHALL remain in the runtime bundle.

#### Scenario: anonymous user is redirected

- **WHEN** an unauthenticated user navigates to `/chat`
- **THEN** the browser URL changes to `/login`
- **AND** no `/api/chats` request is issued

#### Scenario: visual surface is preserved

- **WHEN** the user lands on `/chat` while authenticated
- **THEN** the panel renders with the same glass, sidebar, and
  message-bubble styling as before the change
- **AND** the title looks like a heading in both the static and
  edit states
- **AND** no `mockData` or `cannedReplies` symbols are imported
  by `ChatPanel`

### Requirement: ChatPanel header shows the active chat's project name

When a chat is active, the chat header SHALL display the chat's
`project_name` next to the existing title control. The value
SHALL come from the `Chat` object already loaded by
`getChat(activeChatId)` (no extra API call). When the active
chat is null (no chat selected), the project name SHALL NOT be
shown.

#### Scenario: project name renders next to the title

- **WHEN** the active chat has `project_name = "My research"`
- **THEN** the chat header shows `"My research"` next to the
  title

#### Scenario: no project name when no chat is active

- **WHEN** no chat is selected
- **THEN** the chat header does not render a project name

### Requirement: ChatPanel integrates the project switcher from project-frontend

The chat panel SHALL host the project switcher `<select>`
specified in `project-frontend`'s "chat panel shows the active
project and a project switcher" requirement. The switcher SHALL
be populated by `listProjects()` on mount and refreshed
whenever the panel's `refresh()` runs. The current value of the
switcher SHALL be the active chat's `project_id` (when a chat is
active) or the user-default project's `id` (when no chat is
active). The switcher SHALL be disabled while `listProjects()` is
in flight.

#### Scenario: switcher is populated alongside the chat list

- **WHEN** the user navigates to `/chat` and is authenticated
- **THEN** `listProjects()` is called in addition to
  `listChats()`
- **AND** the switcher shows the user's projects
- **AND** the switcher's current value matches the active chat's
  `project_id` (or the user-default project when no chat is
  active)

#### Scenario: project name in the header matches the switcher

- **WHEN** the user picks a different project from the switcher
- **THEN** the chat header's project name updates to match the
  selected project
- **AND** the `project_name` field on the active chat (if any) is
  NOT updated by the switcher (the switcher is display-only in
  v1; per-chat `project_id` is set on chat creation only)
