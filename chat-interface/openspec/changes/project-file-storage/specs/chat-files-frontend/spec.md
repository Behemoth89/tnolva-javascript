# chat-files-frontend Specification (delta)

## Purpose

Define the chat-side file-attachment experience: a file
attachment picker in the chat composer (multi-file support),
upload progress / error handling for the per-file uploads,
rendering of file chips on user bubbles, the "Add to project
files" affordance on LLM-generated attachments surfaced from
assistant messages, and a download link per chip. The feature
consumes the `project-files-api` and `chat-api` REST surfaces
and follows the existing per-component `useState` +
`useEffect` + manual `refresh()` pattern used by every other
page in the app.

## ADDED Requirements

### Requirement: composer accepts file attachments

The chat composer's `<input type="file">` SHALL accept
`accept` values that cover the common file types documented
in the change (`text/*`, `image/*`, `application/pdf`, common
code MIME types — the exact allowlist is
`text/*,image/*,application/pdf,application/json,application/xml,application/javascript,text/markdown,text/csv`).
The composer SHALL allow multiple file selections in one
pick (the input's `multiple` attribute is set). On submit, the
composer SHALL upload each pending file via
`uploadProjectFile(projectId, file, { source: 'chat_upload' })`
sequentially, in the order the user picked them, before
calling `sendMessage(chatId, { content, file_ids: [...ids] })`.
The composer's submit button SHALL be disabled while any
upload or the `sendMessage` call is in flight.

#### Scenario: single attachment is uploaded then sent

- **WHEN** the user picks one file and submits a non-empty
  message
- **THEN** the composer first calls
  `uploadProjectFile(projectId, file, { source: 'chat_upload' })`
- **AND** on success the resulting `id` is added to
  `file_ids`
- **AND** `sendMessage(chatId, { content, file_ids })` is
  called
- **AND** on success the composer clears the pending
  attachments and the text

#### Scenario: multiple attachments are uploaded then sent

- **WHEN** the user picks three files and submits a non-empty
  message
- **THEN** the composer uploads all three in order
- **AND** `file_ids` is an array of the three resulting
  `id`s, in the same order
- **AND** `sendMessage` is called with all three ids

#### Scenario: failed upload aborts the send

- **WHEN** the second of three uploads returns a 4xx / 5xx
- **THEN** `sendMessage` is NOT called
- **AND** the composer surfaces the server's `error` string
- **AND** the successfully uploaded file (id 1) is removed
  from pending and the backend is left with a chat_upload
  file in the project (no transactional cleanup in v1; this
  is the documented trade-off — see the `chat-files-frontend`
  requirement "failed upload leaves a file behind")

#### Scenario: submit is disabled during upload

- **WHEN** any upload or `sendMessage` call is in flight
- **THEN** the composer's submit button is disabled
- **AND** no second submit is allowed

### Requirement: pending attachments list with per-file remove

The composer SHALL render a row of "pending attachment" chips
beneath the file input. Each chip SHALL show the file's
filename and a remove (`×`) affordance. Clicking `×` SHALL
remove that file from the pending list WITHOUT calling
`uploadProjectFile`. If the file has not yet been uploaded
this is a no-op on the backend; if the file has been uploaded
(the user removed it from the post-upload pending list, which
is shown briefly between upload and send — see
"in-flight uploads show a pending state") the chip SHALL also
unlink the file by calling `deleteProjectFile(id)`. The
in-flight state SHALL be shown as a disabled chip with a
"uploading…" label that is replaced on success with the chip
in its post-upload pending state.

#### Scenario: removed pre-upload file is dropped

- **WHEN** the user picks a file and then clicks `×` before
  submitting
- **THEN** the chip disappears
- **AND** no `uploadProjectFile` call is issued
- **AND** no `project_files` row is created

#### Scenario: in-flight upload is shown

- **WHEN** an upload is in flight
- **THEN** the chip is disabled
- **AND** the chip's label is "uploading…"
- **AND** on success the chip is enabled and shows the
  filename

#### Scenario: post-upload remove cleans up the file

- **WHEN** the user clicks `×` on a chip whose file has
  already been uploaded (and the message has not yet been
  sent)
- **THEN** `deleteProjectFile(id)` is called
- **AND** the chip is removed from the pending list
- **AND** the message send (when it eventually happens) does
  NOT include that `id` in `file_ids`

### Requirement: failed upload leaves a file behind (documented)

The composer MUST NOT roll back previously-uploaded files
when an upload in the middle of a multi-file batch fails
(see the "composer accepts file attachments" — "failed
upload aborts the send" scenario). The previously-uploaded
files in the same batch remain in the project as
`chat_upload` files (visible in the project file browser
and in the project's `chat_upload` source filter) but they
are not attached to any message. This is the documented v1
behaviour; the file browser UI surfaces them as
`chat_upload` files without a chat message, and the user can
delete them from there if they want.

#### Scenario: failed upload does not roll back earlier uploads

- **WHEN** the user submits a message with three pending
  files
- **AND** the first upload succeeds and the second fails
- **THEN** the first file's `project_files` row still exists
  (no rollback)
- **AND** the composer surfaces the error
- **AND** the first file appears in the project's file
  browser under `source = 'chat_upload'`

### Requirement: assistant message attachments surface "Add to project files"

The chat view MUST render one attachment card per entry in an
assistant message's `attachments` array (the `attachments`
field added in the `chat-api` ADDED Requirements for assistant
messages). Each card MUST show the attachment's filename and
MIME type, and MUST include a button labeled "Add to project
files". Clicking the button MUST call
`saveLlmGeneratedFile(projectId, { chat_id, message_id,
attachment_index })` (where `attachment_index` is the
attachment's position in the message's `attachments` array)
and MUST replace the button with a "Saved" badge and a link
to the file's download URL on success. The card MUST disable
the button while the call is in flight and MUST show the
server's `error` string on failure. The action is opt-in and
MUST NOT be invoked automatically; the only path that creates
`source = 'llm_generated'` files is this button.

#### Scenario: "Add to project files" creates an llm_generated file

- **WHEN** an assistant message has one attachment
- **AND** the user clicks "Add to project files" on that
  attachment
- **THEN** `saveLlmGeneratedFile(projectId, { chat_id,
  message_id, attachment_index: 0 })` is called
- **AND** on success the button is replaced by a "Saved"
  badge and a "Download" link to
  `downloadProjectFileUrl(returnedId)`
- **AND** a `project_files` row exists with
  `source = 'llm_generated'`, the correct
  `source_chat_id`, and `source_message_id`

#### Scenario: button is disabled while saving

- **WHEN** `saveLlmGeneratedFile` is in flight
- **THEN** the "Add to project files" button is disabled
- **AND** a second click does not issue a second request

#### Scenario: server error is surfaced

- **WHEN** the server returns 4xx / 5xx from
  `saveLlmGeneratedFile`
- **THEN** the button is re-enabled
- **AND** the card shows the server's `error` string

#### Scenario: never invoked automatically

- **WHEN** the chat loads with an assistant message that has
  attachments
- **THEN** the "Add to project files" button is rendered in
  its initial enabled state
- **AND** no `saveLlmGeneratedFile` call is issued until the
  user clicks the button

### Requirement: file chips on user bubbles with download link

The chat view MUST render a row of file chips above (or
beneath, in the existing bubble layout) a user message's text
when the user message has one or more `file_ids` (per
`chat-api` ADDED Requirements for `chat_messages.file_id` and
`chat_message_files`). Each chip MUST show the file's
filename and MUST be a link to
`downloadProjectFileUrl(fileId)`. Clicking a chip MUST open
the download URL in a new tab. When the user message has no
`file_ids`, the chat view MUST NOT render any chips for that
message.

#### Scenario: user bubble with one file shows one chip

- **WHEN** a user message has `file_id = 42`
- **THEN** the bubble renders one chip linking to
  `downloadProjectFileUrl(42)`
- **AND** the chip shows the file's filename

#### Scenario: user bubble with multiple files shows multiple chips

- **WHEN** a user message has three `file_ids` via
  `chat_message_files`
- **THEN** the bubble renders three chips in `position`
  order
- **AND** each chip links to the matching
  `downloadProjectFileUrl(<id>)`

#### Scenario: user bubble with no files shows no chips

- **WHEN** a user message has no `file_id` and no
  `chat_message_files` rows
- **THEN** no chips are rendered

#### Scenario: download opens a new tab

- **WHEN** the user clicks a chip
- **THEN** a new tab opens to
  `downloadProjectFileUrl(fileId)`
- **AND** the request includes the auth cookie
