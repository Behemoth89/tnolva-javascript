# project-files-api Specification (delta)

## Purpose

Define the backend persistence, on-disk storage layout, REST API,
and LLM-access interface for project files. The system SHALL
persist a `project_files` table in SQLite, store file bytes on
local disk under a per-project directory, expose
`/api/projects/:id/files*` endpoints scoped to the project owner
for upload, download, list, filter, and delete, and expose LLM
access to project files through a single named interface
(`ProjectFileAccess`) so the retrieval strategy can be swapped
without touching storage, upload, download, or chat flows.

## ADDED Requirements

### Requirement: project_files schema

The backend SHALL persist project files in SQLite via a new table
added to `backend/src/db.ts` `initDb`. The table SHALL be
created with `CREATE TABLE IF NOT EXISTS` and SHALL have the
following shape:

```sql
CREATE TABLE IF NOT EXISTS project_files (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id          INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id             INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  filename            TEXT    NOT NULL,
  mime_type           TEXT    NOT NULL,
  size_bytes          INTEGER NOT NULL CHECK (size_bytes >= 0),
  storage_path        TEXT    NOT NULL,
  source              TEXT    NOT NULL CHECK (source IN ('project_upload','chat_upload','llm_generated')),
  source_chat_id      INTEGER REFERENCES chats(id)         ON DELETE SET NULL,
  source_message_id   INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id
  ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_source
  ON project_files(project_id, source);
```

The `source` column discriminates how the file entered the
project. `storage_path` is the absolute on-disk path; it SHALL NOT
be derived from the user-supplied filename.

#### Scenario: schema is created on first startup

- **WHEN** the backend process starts against a fresh SQLite file
- **THEN** the `project_files` table exists with the columns and
  constraints above
- **AND** both indexes exist

#### Scenario: schema creation is idempotent

- **WHEN** the backend process starts against a SQLite file that
  already has this table
- **THEN** startup does not fail and the existing table is
  preserved

#### Scenario: project_files cascade on project delete

- **WHEN** a `projects` row is deleted
- **THEN** every `project_files` row with a matching
  `project_id` is also removed
- **AND** no row references the deleted project afterward

### Requirement: chat_message_files join table for multi-attachment

The backend SHALL persist the mapping of `chat_messages` to
`project_files` in a new table added to `backend/src/db.ts`
`initDb`. The table SHALL be created with
`CREATE TABLE IF NOT EXISTS` and SHALL have the following shape:

```sql
CREATE TABLE IF NOT EXISTS chat_message_files (
  chat_message_id  INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  project_file_id  INTEGER NOT NULL REFERENCES project_files(id)  ON DELETE CASCADE,
  position         INTEGER NOT NULL,
  PRIMARY KEY (chat_message_id, project_file_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_message_files_file
  ON chat_message_files(project_file_id);
```

The backend SHALL also add a nullable `file_id` column to the
existing `chat_messages` table. The `file_id` column holds the
**first** attachment of the message (when the message has any
attachment at all) so the common single-file case is a single
column read; the full attachment list is the union of
`chat_messages.file_id` and the `chat_message_files` rows for the
message.

```sql
ALTER TABLE chat_messages ADD COLUMN file_id INTEGER
  REFERENCES project_files(id) ON DELETE SET NULL;
```

The migration SHALL be idempotent: the additive column add is
wrapped so a second run against a DB that already has the column
does not throw.

#### Scenario: join table is created on first startup

- **WHEN** the backend process starts against a fresh SQLite file
- **THEN** the `chat_message_files` table exists
- **AND** the `file_id` column exists on `chat_messages`

#### Scenario: row is removed when its message is removed

- **WHEN** a `chat_messages` row is deleted
- **THEN** every `chat_message_files` row with a matching
  `chat_message_id` is also removed

#### Scenario: row is removed when its file is removed

- **WHEN** a `project_files` row is deleted
- **THEN** every `chat_message_files` row with a matching
  `project_file_id` is also removed
- **AND** every `chat_messages.file_id` referencing it is set
  to NULL

### Requirement: on-disk storage layout is per-project

The backend SHALL store file bytes on local disk under the
directory resolved by the new `projectFilesRoot` config (default
`<dataDir>/project-files`). Each file SHALL be written to
`<projectFilesRoot>/<project_id>/<file_id><.ext>` where
`<file_id>` is the SQLite `project_files.id` (assigned by the
insert) and `<.ext>` is derived from the **sniffed** MIME type
(falling back to no extension when the MIME type is not in the
known extension map). Uploads SHALL be staged in
`<projectFilesRoot>/_tmp/` and atomically renamed into the
per-project directory once the DB row is committed. The
`storage_path` column SHALL be the absolute path of the final
file. A startup sweep SHALL remove files under
`<projectFilesRoot>/_tmp/` older than one hour.

#### Scenario: upload lands under the project directory

- **WHEN** an upload to project 7 completes successfully
- **THEN** a file exists at
  `<projectFilesRoot>/7/<id><.ext>`
- **AND** the `project_files.storage_path` equals that absolute
  path
- **AND** no file exists under `<projectFilesRoot>/_tmp/` for
  that upload

#### Scenario: original filename is not used on disk

- **WHEN** an upload named `../../../etc/passwd` is processed
- **THEN** the row's `filename` is `../../../etc/passwd`
- **AND** the on-disk path is under
  `<projectFilesRoot>/<project_id>/<id><.ext>`
- **AND** no parent-directory escape occurred

#### Scenario: project delete cleans up the directory

- **WHEN** project 7 is deleted
- **THEN** `<projectFilesRoot>/7/` no longer exists
- **AND** the SQLite rows for project 7 are gone

#### Scenario: temp sweep on startup

- **WHEN** the backend starts and a file under
  `<projectFilesRoot>/_tmp/` has an mtime older than one hour
- **THEN** the file is removed during startup

### Requirement: POST /api/projects/:id/files uploads a file

The backend SHALL expose `POST /api/projects/:id/files`, guarded
by `requireAuth` and scoped to `req.auth.userId`, accepting a
`multipart/form-data` body with a single `file` part. The
endpoint SHALL:

1. Verify the project is owned by `req.auth.userId` (404
   otherwise).
2. Enforce a per-file size cap of `25 * 1024 * 1024` bytes via
   `multer` `limits.fileSize`; return 413 on overflow.
3. Sniff the MIME type from the first 16 KB of the file
   (signature-based); do NOT trust the client's `Content-Type`.
4. Stage the upload under
   `<projectFilesRoot>/_tmp/<random>`; on any error, unlink
   the staged file.
5. Compute `size_bytes` from the staged file's size.
6. Insert a `project_files` row with
   `source = 'project_upload'` (default) or
   `source = 'chat_upload'` (when the form field `source` equals
   `'chat_upload'`); `user_id = req.auth.userId`; `filename =
   <original client filename>`; `mime_type = <sniffed>`;
   `size_bytes = <size>`; `storage_path = <absolute final path>`.
7. Atomically rename the staged file into
   `<projectFilesRoot>/<project_id>/<id><.ext>`.
8. Return 201 with the persisted row (without `storage_path`).

The endpoint SHALL return JSON `{ "error": string }` on failure
with 400 (no file part), 401 (no auth), 404 (project not owned
or unknown), 413 (file too large), or 500 (unexpected).

#### Scenario: successful upload

- **WHEN** an authenticated user uploads a 1 MB PNG to
  `/api/projects/<their project id>/files`
- **THEN** the response status is 201
- **AND** the response body has `filename` = the original
  filename
- **AND** the response body has `mime_type` = `image/png`
  (sniffed)
- **AND** the response body has `size_bytes` = 1048576
- **AND** the response body has `source` = `'project_upload'`
- **AND** a file exists at the resolved `storage_path`
- **AND** a `project_files` row exists with the same `id`

#### Scenario: chat_upload source is honored

- **WHEN** an authenticated user uploads a file with the form
  field `source = 'chat_upload'`
- **THEN** the response body has `source` = `'chat_upload'`

#### Scenario: file over the cap is rejected

- **WHEN** an authenticated user uploads a 26 MB file
- **THEN** the response status is 413
- **AND** no `project_files` row is inserted
- **AND** no file is left under the project's directory

#### Scenario: project not owned returns 404

- **WHEN** user A uploads to user B's project
- **THEN** the response status is 404
- **AND** no `project_files` row is inserted

#### Scenario: missing file part is rejected

- **WHEN** an authenticated user posts a multipart body with
  no `file` part
- **THEN** the response status is 400
- **AND** the response body is `{ "error": "..." }`

### Requirement: GET /api/projects/:id/files lists files with filtering

The backend SHALL expose `GET /api/projects/:id/files`, guarded
by `requireAuth` and scoped to `req.auth.userId`, returning
the project's files ordered by `created_at DESC`. The response
SHALL be paginated with `?limit` (default 50, max 200) and
`?offset` (default 0) query parameters. The endpoint SHALL
accept a `?source` query parameter that, when present, filters
to rows where `source = <value>`; when absent, no source filter
is applied. The response SHALL be a JSON object
`{ "items": ProjectFile[], "total": number, "limit": number,
"offset": number }` where `ProjectFile` is the row minus
`storage_path`. The endpoint SHALL return 404 when the project
is not owned by the caller or is unknown.

#### Scenario: list returns the project's files

- **WHEN** user A's project 7 has three files
- **AND** user A calls `GET /api/projects/7/files`
- **THEN** the response status is 200
- **AND** the response body's `items` has length 3
- **AND** the items are in `created_at DESC` order
- **AND** `total` = 3
- **AND** no item has a `storage_path` field

#### Scenario: source filter narrows the list

- **WHEN** user A's project has 2 `chat_upload` files and 1
  `project_upload` file
- **AND** user A calls
  `GET /api/projects/7/files?source=chat_upload`
- **THEN** the response body's `items` has length 2
- **AND** every item has `source = 'chat_upload'`

#### Scenario: pagination is honored

- **WHEN** user A's project has 60 files
- **AND** user A calls
  `GET /api/projects/7/files?limit=20&offset=40`
- **THEN** the response body's `items` has length 20
- **AND** `limit` = 20
- **AND** `offset` = 40
- **AND** `total` = 60

#### Scenario: project not owned returns 404

- **WHEN** user A calls `GET /api/projects/8/files` for user
  B's project 8
- **THEN** the response status is 404

### Requirement: GET /api/projects/files/:fileId downloads a file

The backend SHALL expose
`GET /api/projects/files/:fileId`, guarded by `requireAuth`,
resolving the file's `project_id` and checking it is owned by
`req.auth.userId` (404 otherwise). The response SHALL be the
raw file bytes with `Content-Type` set to the row's `mime_type`
and `Content-Disposition` set to
`attachment; filename="<original filename>"` (RFC 5987 encoded
when the filename contains non-ASCII). The endpoint SHALL
return 404 when the file id is unknown or not owned by the
caller. The endpoint SHALL return 410 Gone when the row exists
but the on-disk file is missing (the DB row is the source of
truth; a missing file is a tombstone).

#### Scenario: owner downloads their file

- **WHEN** user A owns a project with file id 42
- **AND** user A calls `GET /api/projects/files/42`
- **THEN** the response status is 200
- **AND** the response Content-Type equals the row's
  `mime_type`
- **AND** the body bytes equal the original upload's bytes
- **AND** the `Content-Disposition` header includes the
  original filename

#### Scenario: non-owner cannot download

- **WHEN** user A calls `GET /api/projects/files/42` for a file
  in user B's project
- **THEN** the response status is 404
- **AND** the response body is `{ "error": "..." }`

#### Scenario: missing on-disk file returns 410

- **WHEN** the `project_files` row exists with id 42
- **AND** the file at `storage_path` is missing
- **AND** the owner calls `GET /api/projects/files/42`
- **THEN** the response status is 410

### Requirement: DELETE /api/projects/files/:fileId removes a file

The backend SHALL expose
`DELETE /api/projects/files/:fileId`, guarded by `requireAuth`,
resolving the file's `project_id` and checking it is owned by
`req.auth.userId` (404 otherwise). On success the endpoint
SHALL run in a SQLite transaction: delete the row, then
`fs.unlink` the file at `storage_path`. If the `unlink` fails
(ENOENT or otherwise) the row deletion still commits and the
error is logged. The response is 204 on success; 404 when the
id is unknown or not owned by the caller.

#### Scenario: owner deletes a file

- **WHEN** user A owns a file with id 42
- **AND** user A calls `DELETE /api/projects/files/42`
- **THEN** the response status is 204
- **AND** a subsequent `GET /api/projects/files/42` returns 404
- **AND** the on-disk file is gone

#### Scenario: non-owner cannot delete

- **WHEN** user A calls `DELETE /api/projects/files/42` for a
  file in user B's project
- **THEN** the response status is 404
- **AND** the file still exists

### Requirement: POST /api/projects/:id/files/from-message saves an LLM-generated file

The backend SHALL expose
`POST /api/projects/:id/files/from-message`, guarded by
`requireAuth` and scoped to `req.auth.userId`, accepting a
JSON body of
`{ "chat_id": number, "message_id": number, "attachment_index":
number }`. The endpoint SHALL:

1. Verify the project is owned by `req.auth.userId` (404
   otherwise).
2. Verify the chat is owned by `req.auth.userId` and belongs
   to the project (404 otherwise).
3. Load the message; verify `role = 'assistant'` and the
   structured attachments at `attachment_index` exists on the
   message (the message's `attachments` JSON column or
   equivalent — see `chat-api` ADDED Requirements for the
   assistant attachment shape).
4. Read the attachment's `filename`, `mime_type`, and content
   (decoded if base64 / utf-8 text).
5. Enforce a size cap of `25 * 1024 * 1024` bytes; 413 if
   exceeded.
6. Insert a `project_files` row with
   `source = 'llm_generated'`, `source_chat_id = chat_id`,
   `source_message_id = message_id`, and the derived
   `filename` / `mime_type` / `size_bytes`. The on-disk path
   follows the same per-project layout as project_upload.
7. Return 201 with the persisted row (without `storage_path`).

The endpoint SHALL never be called automatically by the chat
loop, the LLM dispatch, or any provider client; the only
caller in v1 is the frontend's "Add to project files" action
on an LLM-generated attachment.

#### Scenario: LLM-generated file is saved on opt-in

- **WHEN** user A owns project 7 and chat 100 in that project
- **AND** chat 100 has an assistant message with two
  structured attachments
- **AND** user A posts
  `{ "chat_id": 100, "message_id": <the assistant message id>,
  "attachment_index": 0 }` to
  `/api/projects/7/files/from-message`
- **THEN** the response status is 201
- **AND** the response body's `source` = `'llm_generated'`
- **AND** the response body's `source_chat_id` = 100
- **AND** the response body's `source_message_id` = the
  assistant message id
- **AND** a `project_files` row exists with the same `id`
- **AND** the bytes written to disk equal the attachment's
  decoded content

#### Scenario: chat does not belong to the project

- **WHEN** chat 100 belongs to project 8, not project 7
- **AND** user A posts the same body to
  `/api/projects/7/files/from-message`
- **THEN** the response status is 404
- **AND** no row is inserted

#### Scenario: oversized attachment is rejected

- **WHEN** the attachment's decoded content exceeds 25 MB
- **THEN** the response status is 413
- **AND** no row is inserted
- **AND** no file is left under the project's directory

#### Scenario: user message is rejected

- **WHEN** the message is a user message, not an assistant
  message
- **THEN** the response status is 400

### Requirement: ProjectFileAccess interface

The backend SHALL define a `ProjectFileAccess` interface in
`backend/src/projects/projectFileAccess.ts` with a single
method:

```ts
export interface ProjectFileRef {
  fileId: number;
  filename: string;
  mimeType: string;
  contentText: string;
  dropped?: { reason: "budget" };
}

export interface ProjectFileAccess {
  resolveForLlm(input: {
    projectId: number;
    chatId: number;
    userMessage: string;
  }): Promise<ProjectFileRef[]>;
}
```

The interface SHALL be the only place in the codebase that
defines how the LLM gets project-file content. The chat
service SHALL call `projectFileAccess.resolveForLlm(...)` once
per `POST /api/chats/:id/messages` and SHALL pass the result
on `LlmRequest.projectFiles` (see `chat-api` ADDED
Requirements). The provider clients SHALL NOT inspect
`projectFiles`; the field is opaque to them and is not
forwarded to the upstream wire. A single implementation
(`WholeFileProjectFileAccess`) SHALL be bound in `app.ts` in
v1; replacing the implementation (e.g. with an embedding/RAG
strategy) SHALL NOT require changes to the chat service, the
chat router, the LLM client, the provider clients, or any
frontend code.

#### Scenario: interface has exactly one method

- **WHEN** the `ProjectFileAccess` interface is inspected
- **THEN** it has the single method
  `resolveForLlm(input): Promise<ProjectFileRef[]>` with the
  shape above

#### Scenario: chat service calls the interface

- **WHEN** user A posts a message to a chat whose project has
  files
- **THEN** the chat service calls
  `projectFileAccess.resolveForLlm` exactly once with the
  chat's `projectId`, `chatId`, and the user message text
- **AND** the resolved `ProjectFileRef[]` is set on the
  outgoing `LlmRequest.projectFiles`

#### Scenario: provider clients ignore projectFiles

- **WHEN** `LlmRequest.projectFiles` is non-empty
- **THEN** the upstream request body for any of the three
  providers does NOT include the `projectFiles` field
- **AND** no upstream request body contains file content from
  `projectFiles`

### Requirement: WholeFileProjectFileAccess v1 implementation

The backend SHALL provide a
`WholeFileProjectFileAccess` implementation of
`ProjectFileAccess` in
`backend/src/projects/wholeFileProjectFileAccess.ts`. The
implementation SHALL:

1. Query all `project_files` rows for the given `projectId`
   in `created_at ASC` order.
2. For each row, skip files whose `mime_type` does not have a
   text representation (e.g. `image/*`, `application/octet-stream`).
3. Read the file bytes from `storage_path`; decode as UTF-8
   (with replacement) for the `contentText` field.
4. Truncate each file's `contentText` at `100_000` characters;
   files that hit the cap are returned with
   `dropped: { reason: "budget" }` ONLY if the file was
   truncated.
5. Stop adding files once the cumulative
   `contentText.length` reaches `200_000`; the remaining
   files are omitted from the result.
6. Return the resulting `ProjectFileRef[]`.

The cap values are hard-coded in v1 and are NOT part of the
public API. The implementation is the only consumer of the
budget in v1.

#### Scenario: small project fits in budget

- **WHEN** project 7 has two files each 50k characters of
  text
- **THEN** the resolved `ProjectFileRef[]` has length 2
- **AND** no `dropped` flag is set

#### Scenario: large project hits the per-file cap

- **WHEN** project 7 has a 200k-character text file
- **THEN** the resolved `ProjectFileRef[]` has length 1
- **AND** the file's `contentText` is exactly 100_000
  characters
- **AND** the file's `dropped` is
  `{ reason: "budget" }`

#### Scenario: large project hits the total cap

- **WHEN** project 7 has three text files of 80k characters
  each
- **THEN** the resolved `ProjectFileRef[]` has length 2
- **AND** the cumulative `contentText.length` is at most
  200_000

#### Scenario: binary files are skipped

- **WHEN** project 7 has a `image/png` file and a text file
- **THEN** the resolved `ProjectFileRef[]` has length 1
- **AND** the text file is included
- **AND** the image is not in the result

#### Scenario: empty project returns empty array

- **WHEN** project 7 has no files
- **THEN** the resolved `ProjectFileRef[]` is empty

### Requirement: project file endpoints return a JSON error body on failure

Every error response from `/api/projects/:id/files*` and `/api/projects/files/:fileId` MUST be JSON with Content-Type `application/json` and a body that parses to an object with a single `error` string field. Status codes MUST be:

- 400 — missing file part, bad `source` value, user message
  for `/from-message`
- 401 — `requireAuth` failure
- 404 — project / file not found or not owned by the caller
- 410 — file row exists but on-disk file is missing
- 413 — file exceeds the 25 MB cap
- 500 — unexpected server error

#### Scenario: 400 body shape

- **WHEN** any project-file endpoint returns 400
- **THEN** the response Content-Type is `application/json`
- **AND** the body parses to an object with a single `error`
  string
