## MODIFIED Requirements

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

## ADDED Requirements

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
switcher SHALL be the active chat's `project_id` (when a chat
is active) or the user-default project's `id` (when no chat is
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
