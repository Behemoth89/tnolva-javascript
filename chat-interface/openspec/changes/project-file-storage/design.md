# Design — project-file-storage

## Context

The product today has no first-class file storage. A chat can
transiently mention a file the user pasted, but:

- There is no per-project file store — a user cannot attach a file
  to a project, browse it later, or delete it.
- There is no upload path inside chat that produces a durable file
  the user can keep.
- The LLM cannot see project files; the `LlmRequest` only carries
  `system` and `messages` (per `chat-api`).
- The LLM cannot hand the user a file-like artifact it produced
  during a reply; there is no concept of a generated file.

This change introduces a project-level file system on top of SQLite
(already used for chats, projects, and the LLM catalog) and local
disk, with a thin retrieval interface the LLM dispatch can call.
The retrieval strategy is the only thing intentionally left
swappable.

## Goals / Non-Goals

**Goals**

- Persist file bytes on local disk under a per-project directory;
  persist metadata only in SQLite.
- Expose REST endpoints to upload, download, list, filter, and
  delete project files.
- When a user uploads a file inside a chat, the file is stored
  exactly once as a `project_files` row with
  `source = 'chat_upload'` and is linked to the originating chat
  and message.
- Expose LLM access to project files through a single, named
  interface (`ProjectFileAccess`) so the retrieval strategy can
  change without touching storage or upload/download flows.
- Allow the user to explicitly opt in to "Add to project files"
  for LLM-generated artifacts; this opt-in is the only path that
  creates `llm_generated` files and is never invoked automatically.
- Surface a project file browser UI for list / filter / upload /
  download / delete.

**Non-Goals**

- Cloud object storage (S3 / GCS / Azure Blob). Local disk only in
  v1; the storage helper is the only thing that would change to
  move off-disk later.
- RAG / embeddings / vector search in v1. The v1
  `ProjectFileAccess` implementation is whole-file injection. The
  interface is shaped so an embedding-backed implementation can be
  dropped in without changing call sites.
- A binary format / file-conversion pipeline (no PDF text
  extraction, no image transcoding, etc.). Files are stored as
  uploaded; downloads return the original bytes.
- Sharing files between users or projects. Files are scoped to a
  single project owned by a single user.
- File version history. Each upload creates a new row.
- A real-time upload progress channel. The v1 upload is a single
  multipart POST with a single JSON response.

## Decisions

### D1 — On-disk layout: per-project directory, opaque filenames

**Decision.** Files are stored under
`<projectFilesRoot>/<project_id>/<file_id><.ext>`, where `file_id`
is the SQLite `project_files.id` (assigned by the row insert) and
`.ext` is derived from the stored MIME type. The `storage_path`
column on `project_files` is the absolute on-disk path.

**Why.** A per-project directory gives a trivial way to garbage
collect a project (delete the directory on project delete, via a
transaction-safe hook) and a trivial way to enforce per-project
quotas later. An opaque `<file_id>.ext` filename means we never
trust the user-supplied filename on disk; the original filename is
metadata in SQLite.

**Alternatives considered.**

- Storing under `<projectFilesRoot>/<user_id>/<project_id>/...`
  adds a layer we do not use and complicates project delete.
- Hash-based sharding (e.g. `<project_id>/<sha256[0:2]>/<id>`)
  is unnecessary at this scale and obscures the on-disk layout.

### D2 — Multipart upload via multer, stored in a temp file

**Decision.** `POST /api/projects/:id/files` is a
`multipart/form-data` endpoint. The backend uses `multer` with
`diskStorage` to write the upload to a temp file under
`<projectFilesRoot>/_tmp/`, validates, computes `size` and the
detected MIME type, then atomically renames the temp file into
`<projectFilesRoot>/<project_id>/<id><.ext>` and inserts the
`project_files` row in the same request. On any error the temp
file is unlinked.

**Why.** Streaming a multi-megabyte upload directly into SQLite
(or buffering it in process memory) is wasteful; the disk already
has plenty of room. Multer is already a transitive dep of the
existing Express setup and the alternative (hand-rolled
multipart) is a maintenance liability.

**Alternatives considered.**

- `busboy` directly: equivalent, but no benefit over multer here.
- Direct body buffering: rejected for memory pressure.

### D3 — `ProjectFileAccess` interface in
`backend/src/projects/projectFileAccess.ts`

**Decision.** The interface has one method:

```ts
export interface ProjectFileAccess {
  resolveForLlm(input: {
    projectId: number;
    chatId: number;
    userMessage: string;
  }): Promise<ProjectFileRef[]>;
}
```

`ProjectFileRef` is a stable, provider-agnostic shape:
`{ fileId, filename, mimeType, contentText }` where `contentText`
is the in-memory text representation the v1 whole-file
implementation loads. The chat service calls
`projectFileAccess.resolveForLlm(...)` once per message and passes
the result on `LlmRequest.projectFiles`. The provider clients
ignore `projectFiles` (it never reaches the upstream wire).

**Why.** This is the single point where the LLM "sees" files.
A future embedding/RAG implementation can be swapped in by
replacing the implementation bound in `app.ts` (or via a
factory) without touching the chat router, chat service, LLM
client, frontend, or storage. The interface takes the user's
text and the chat context so a RAG implementation can use both
for retrieval; the v1 whole-file implementation ignores them
and returns all project files (clipped by a per-file and total
character budget — see D4).

**Alternatives considered.**

- A tool-calling interface (e.g. `getProjectFile(id)`) the LLM
  invokes: more flexible but requires a provider that supports
  tool calls and adds a round-trip. Out of scope for v1; the
  interface is shaped to allow a future "tool-call" implementation
  to live alongside whole-file.
- Embeddings/RAG now: deferred; the interface is the seam.

### D4 — v1 whole-file budget: per-file 100k chars, total 200k chars

**Decision.** The v1 `WholeFileProjectFileAccess` returns project
files for the chat's project in `created_at ASC` order, skipping
binary files (no text representation), until either a per-file
`100_000` character cap or a `200_000` total cap is reached. Files
that would push past the cap are dropped with a one-line
`{ dropped: true, reason: "budget" }` annotation on the returned
`ProjectFileRef` so the model knows it missed some context. The
budget caps are hard-coded in v1; they are NOT part of the public
API.

**Why.** A naïve whole-file injection of an unbounded project
would blow the context window. v1 keeps it small and obvious; the
interface is the only thing the implementation talks to, so a
later RAG strategy can replace this entirely.

### D5 — `chat_messages.file_id` (nullable) + a join table for
multi-attachment

**Decision.** `chat_messages` gains a nullable `file_id` column
for the **primary** attachment (preserving the existing "one
message = one assistant reply" mental model in `chat-api`). For
multi-attachment uploads from the composer, a new
`chat_message_files` join table maps `chat_message_id -> file_id`.
The `file_id` column on the message is therefore the **first**
attachment; the join table is the source of truth for the full
list.

**Why.** Keeping `file_id` as a top-level column keeps the
`chat-api` JSON shape additive (a single optional field on the
message) and means the common single-file case is one cheap join
on `chat_messages` instead of two joins. The join table is only
read when the frontend asks for the full attachment list
(`getChat` returns the union: `file_id` plus
`chat_message_files`).

**Alternatives considered.**

- Drop the `file_id` column and only use the join table: simpler
  schema, but every message read costs an extra join for the
  99% case of one attachment.
- A JSON array column: rejected — SQLite JSON functions are not
  used elsewhere and we want a real FK to `project_files`.

### D6 — LLM-generated files: explicit `POST .../from-message`
endpoint, not auto-create

**Decision.** The chat service does not write any
`source = 'llm_generated'` rows. The frontend renders a "Add to
project files" button on a structured attachment surfaced by an
assistant message; clicking it calls
`POST /api/projects/:id/files/from-message` with the
`chat_id` and `message_id` and an `attachment_index` (to pick
which attachment in the message). The endpoint validates the
caller owns the chat and the message, derives the filename and
content from the assistant message's structured attachment, and
inserts a new `project_files` row with
`source = 'llm_generated'`.

**Why.** "Add to project files" must never happen automatically.
The explicit endpoint is the only path that creates
`llm_generated` rows; the chat loop and the LLM provider clients
never call it. This is auditable in the router and easy to
review.

**Alternatives considered.**

- A webhook from the LLM provider: nonsense, the provider
  doesn't know the user is the source of truth.
- A background job that scans assistant messages: violates the
  "must be explicit" rule.

### D7 — Frontend uses the same upload endpoint for both flows

**Decision.** Both the project-files page and the chat composer
upload through `POST /api/projects/:id/files` with
`multipart/form-data`. The composer uses a `FormData` POST and
sends an extra `source = 'chat_upload'` field. The endpoint
defaults `source` to `'project_upload'` when omitted. The
`/from-message` endpoint is the only one that creates
`llm_generated` rows.

**Why.** One upload code path on the backend, one upload helper
on the frontend. The composer and the file page differ only in
how they tag the row and what they do with the resulting `id`
(the composer immediately attaches it to the outgoing message;
the file page just refreshes its list).

### D8 — Cascading delete is best-effort with a transaction

**Decision.** `DELETE /api/projects/:id/files/:fileId` runs in a
SQLite transaction: delete the row, then `fs.unlink` the storage
path. If the `unlink` fails (file already gone), the row deletion
still commits and the error is logged. A project delete cascades
through the existing `projects` ON DELETE rules; the
corresponding `<projectFilesRoot>/<project_id>` directory is
removed in a single `fs.rm(..., { recursive: true })` after the
SQLite cascade commits.

**Why.** The DB row is the source of truth for what files exist;
a missing on-disk file is recoverable (next read returns 404) but
an orphan row in the DB is not. The cascade strategy matches the
"disk is a cache of DB" stance the rest of the change takes.

## Risks / Trade-offs

- **[Risk] Whole-file injection will hit context limits for
  chatty projects.** → Mitigation: per-file and total character
  caps (D4) drop the tail and annotate; the `ProjectFileAccess`
  interface is the seam for a future RAG implementation.
- **[Risk] Disk fills up if uploads are unbounded.** → Mitigation:
  per-file 25 MB cap enforced by `multer` `limits.fileSize`; 413
  returned to the client. Cap is hard-coded in v1 and called out
  in the API spec; a future per-user quota is a single new config
  key.
- **[Risk] Path traversal via the original filename.** →
  Mitigation: the original filename is stored only as metadata;
  the on-disk filename is `<file_id><.ext>`. The MIME type is
  sniffed from the buffer (first 16 KB) using
  `file-type`/manual signature check; we do NOT trust the client
  `Content-Type`. The extension on disk is derived from the
  sniffed MIME, falling back to no extension.
- **[Risk] Orphan temp files if the server crashes between rename
  and DB insert.** → Mitigation: a startup sweep removes files
  in `<projectFilesRoot>/_tmp/` older than 1 hour. Acceptable
  because temp files are never referenced by the DB.
- **[Risk] Concurrency on the same project directory.** →
  Mitigation: `multer` writes to per-upload temp files with
  random suffixes; the `rename` is a single `fs.renameSync` call
  that is atomic on the same filesystem; the SQLite insert is
  per-row. No two concurrent uploads to the same project can
  collide on the destination filename because each gets a
  distinct `id` from `AUTOINCREMENT` before the rename.
- **[Risk] LLM-generated attachment can be very large.** →
  Mitigation: the `/from-message` endpoint caps the persisted
  bytes at the same 25 MB / 100k-character budget as
  whole-file injection, and refuses with 413 if the attachment
  exceeds either. A truncated copy is NOT stored — the endpoint
  fails closed.
- **[Risk] `/api/projects/:id/files` is chatty for large projects
  (list endpoint).** → Mitigation: list endpoint is paginated
  with `?limit=50&offset=N`; the file browser UI loads on demand,
  not on every chat open.

## Migration Plan

- Schema migration: `project_files` table, indexes, and the new
  `chat_messages.file_id` column are added in `initDb` via
  `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN
  IF NOT EXISTS` (SQLite does not have `IF NOT EXISTS` on
  `ADD COLUMN`; we wrap in a try/catch on the duplicate-column
  error, matching the existing `initDb` pattern for other
  additive migrations).
- On-disk migration: the first boot that needs the files root
  creates it via `fs.mkdir(..., { recursive: true })`. No existing
  data is touched.
- No data backfill; no rows reference project files before this
  change.
- Rollback: `DROP TABLE project_files; DROP TABLE
  chat_message_files; ALTER TABLE chat_messages DROP COLUMN
  file_id` is a no-op against the pre-change DB. The on-disk
  files root can be left in place or removed. No code path
  outside the new routers reads it after rollback.

## Open Questions

- **OQ1.** Should `/api/projects/:id/files` allow an admin to
  view another user's project files? v1: no — only the project
  owner. If admin view is wanted later, gate behind `requireAdmin`
  on the same router.
- **OQ2.** Should the project-files page list `llm_generated`
  files inline with `chat_upload` and `project_upload` files, or
  hide them behind a toggle? v1 spec: show all by default with
  a source filter; the browser defaults to "all".
- **OQ3.** Should the chat composer send `file_ids` as a JSON
  array in the request body (multipart for the files, JSON for
  the metadata) or send each file in a single multipart request
  and attach the resulting `id`s to the subsequent message POST?
  v1 spec: one multipart `POST /api/projects/:id/files` per
  file, then `POST /api/chats/:id/messages` with `file_ids: [...]`
  in the JSON body. Two HTTP round-trips, simpler error
  recovery, and a partial upload does not break the message
  send.
