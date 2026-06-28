# chat-api Specification (delta — additive)

## ADDED Requirements

### Requirement: chat_messages.file_id column

The backend SHALL add a nullable `file_id` column to the
existing `chat_messages` table, referencing
`project_files(id)` with `ON DELETE SET NULL`. The migration
SHALL be additive and idempotent: a second run against a DB
that already has the column does not throw. The `file_id`
column holds the **first** attachment of the message when
the message has any attachment; the full list of attachments
is the union of `chat_messages.file_id` and the
`chat_message_files` rows for the message (see
`project-files-api`'s `chat_message_files` requirement).

#### Scenario: column is added on first startup

- **WHEN** the backend process starts against a fresh SQLite
  file
- **THEN** the `file_id` column exists on `chat_messages`

#### Scenario: column add is idempotent

- **WHEN** the backend process starts against a SQLite file
  that already has this column
- **THEN** startup does not fail

#### Scenario: file_id is cleared on file delete

- **WHEN** a `project_files` row is deleted
- **THEN** every `chat_messages.file_id` referencing it is
  set to NULL

### Requirement: POST /api/chats/:id/messages accepts file_ids

The backend SHALL extend
`POST /api/chats/:id/messages` to accept an optional
`file_ids: number[]` field in the request body. When present
and non-empty, the endpoint SHALL:

1. Validate that every id in `file_ids` is a positive integer.
2. Verify every id resolves to a `project_files` row whose
   `project_id` equals the chat's `project_id` (404 if any
   id is unknown or belongs to a different project).
3. Persist the user message as today; the first id in
   `file_ids` is stored in `chat_messages.file_id` (if
   non-empty).
4. Insert one `chat_message_files` row per id, with
   `position = index in file_ids`.
5. Dispatch the LLM call with
   `LlmRequest.projectFiles` set to
   `projectFileAccess.resolveForLlm({ projectId, chatId,
   userMessage: content })` (the result is the chat's
   project files, NOT the request's `file_ids` — the
   LLM's view of files is the project's file store, gated
   by the `ProjectFileAccess` interface).

When `file_ids` is omitted or empty, behavior is unchanged
from the existing requirement.

#### Scenario: file_ids is recorded on the message

- **WHEN** user A posts
  `{ "content": "See attached", "file_ids": [42, 43] }` to
  `/api/chats/<chat id>/messages`
- **AND** file 42 and 43 belong to the chat's project
- **THEN** the response status is 200
- **AND** the new user message row has `file_id = 42` (the
  first id)
- **AND** two `chat_message_files` rows exist for the new
  message, with `position = 0` (file 42) and
  `position = 1` (file 43)

#### Scenario: file_ids belonging to a different project is rejected

- **WHEN** user A posts
  `{ "content": "x", "file_ids": [99] }` and file 99
  belongs to a different project than the chat
- **THEN** the response status is 404
- **AND** no `chat_messages` row is inserted

#### Scenario: file_ids absent is unchanged

- **WHEN** user A posts
  `{ "content": "hi" }` to
  `/api/chats/<chat id>/messages`
- **THEN** the response status is 200
- **AND** `file_ids` defaults to an empty array
- **AND** the new user message row has `file_id = NULL`

### Requirement: chat message responses include file_ids

The backend SHALL include the resolved attachment list on
every message returned by `GET /api/chats/:id`. The
`file_ids: number[]` field SHALL be the union of
`chat_messages.file_id` and the `chat_message_files` rows for
the message, in `position ASC` order (and `chat_messages.file_id`
first when it is set). The field SHALL always be present
(empty array when the message has no attachments). The same
field SHALL be present on the message echoed back in the
response of `POST /api/chats/:id/messages`.

#### Scenario: messages include file_ids

- **WHEN** a chat has a user message with
  `file_id = 42` and a `chat_message_files` row mapping
  the message to file 43
- **AND** user A calls `GET /api/chats/<chat id>`
- **THEN** the response's `messages` array includes that
  message with `file_ids = [42, 43]`

#### Scenario: messages with no files include an empty file_ids

- **WHEN** a chat has a message with no `file_id` and no
  `chat_message_files` rows
- **THEN** the message has `file_ids = []`

### Requirement: LlmRequest carries projectFiles for LLM dispatch

The `LlmRequest` type SHALL be extended with an optional
`projectFiles: ProjectFileRef[]` field. The chat service
SHALL set this field by calling
`projectFileAccess.resolveForLlm({ projectId, chatId,
userMessage })` exactly once per
`POST /api/chats/:id/messages` call (regardless of whether
`file_ids` is in the request — the LLM always gets the
project's files, not just the user-attached files). The
provider clients SHALL NOT forward `projectFiles` to the
upstream wire; it is opaque to them. The field is a stable
shape defined in `project-files-api`:

```ts
interface ProjectFileRef {
  fileId: number;
  filename: string;
  mimeType: string;
  contentText: string;
  dropped?: { reason: 'budget' };
}
```

#### Scenario: LlmRequest is populated for chats with files

- **WHEN** user A posts a message to a chat whose project
  has two text files
- **THEN** the outgoing `LlmRequest` has
  `projectFiles.length === 2`
- **AND** each `ProjectFileRef` has the file's id, filename,
  mimeType, and contentText

#### Scenario: LlmRequest is empty for chats without files

- **WHEN** user A posts a message to a chat whose project
  has no files
- **THEN** the outgoing `LlmRequest` has
  `projectFiles = []`

#### Scenario: provider requests do not leak projectFiles

- **WHEN** `LlmRequest.projectFiles` is non-empty
- **THEN** the upstream request body for any of the three
  providers does NOT contain the `projectFiles` field or
  any `contentText` from it
- **AND** the upstream request body does NOT contain file
  `fileId`s

### Requirement: assistant messages may carry structured attachments

The backend SHALL allow an assistant message to carry a
non-null `attachments: AssistantAttachment[]` JSON field,
where:

```ts
interface AssistantAttachment {
  filename: string;
  mime_type: string;
  content_b64?: string;   // base64 for binary
  content_text?: string;  // utf-8 text
}
```

Exactly one of `content_b64` or `content_text` SHALL be set.
The field is a read-only metadata column the chat service
sets when persisting the assistant message; the LLM provider
clients do NOT generate attachments. In v1 the only producer
of `attachments` is a future LLM provider capability; the
field is defined here so the chat view, the file UI, and
`/from-message` can rely on a stable shape. When the LLM
provider clients produce an empty / missing
`attachments`, the persisted message has `attachments: []`.

#### Scenario: assistant message with no attachments

- **WHEN** the LLM provider returns no attachments
- **THEN** the persisted assistant message has
  `attachments = []`

#### Scenario: assistant message with a text attachment

- **WHEN** a future LLM provider returns an attachment
  `{ filename: 'spec.md', mime_type: 'text/markdown',
  content_text: '# Hello' }`
- **THEN** the persisted assistant message has
  `attachments[0] = { filename: 'spec.md', mime_type:
  'text/markdown', content_text: '# Hello' }`

### Requirement: assistant attachments are returned to clients

The backend MUST include the assistant message's `attachments`
field on every message returned by `GET /api/chats/:id` and
on the response of `POST /api/chats/:id/messages`. The field
MUST be an empty array (not `null`) when the message has no
attachments.

#### Scenario: assistant attachments are returned

- **WHEN** an assistant message has one attachment
- **AND** user A calls `GET /api/chats/<chat id>`
- **THEN** the response's `messages` array includes that
  message with `attachments = [<the attachment>]`

#### Scenario: no attachments is an empty array

- **WHEN** an assistant message has no attachments
- **THEN** the message has `attachments = []`
