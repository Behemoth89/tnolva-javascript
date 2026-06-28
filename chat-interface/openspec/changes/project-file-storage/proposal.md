## Why

Today, file content has no first-class home in the product. A chat can
transiently reference a file the user pasted, but there is no way to
attach a file to a project, retrieve it later, give the LLM access to
project-scoped files, or let the LLM hand the user a file-like artifact
back. This change introduces project-level file storage so chats and
projects can share a single, durable set of files owned by a project,
while keeping the LLM's retrieval strategy (full injection, tool
calling, or RAG) a swappable layer behind a single interface.

## What Changes

- **Project file storage (backend).** New SQLite table
  `project_files` and per-project directory on local disk for file
  bytes. New `/api/projects/:id/files` and `/api/projects/files/:id`
  endpoints to upload (multipart), download, list, filter, and delete
  project files. Filename, MIME type, size, storage path, source,
  source chat/message, and timestamps are stored in SQLite only.
- **Chat upload linkage.** When a user attaches a file inside a chat,
  the file is stored exactly once as a `project_files` row with
  `source = 'chat_upload'` and the originating `chat_id` /
  `message_id` linked. A new optional `file_id` column on
  `chat_messages` records the attachment.
- **LLM file access (decoupled).** A new
  `ProjectFileAccess` interface in the backend exposes "given a chat
  context, return relevant project file content" so the LLM dispatch
  can call it when the chat's project has files. The default v1
  implementation is whole-file injection, but the interface is the
  only place retrieval strategy is defined, so swapping to tool-calling
  or RAG does not touch storage, upload, download, or chat flows.
- **LLM-generated files (opt-in).** Assistant messages may include
  structured file-like output (filename + content). The frontend
  surfaces a per-attachment "Add to project files" action; the backend
  endpoint `POST /api/projects/:id/files/from-message` persists it
  with `source = 'llm_generated'`, linked to the chat and message.
  This is the only path that creates `llm_generated` files and it is
  never invoked automatically by the chat loop.
- **Project file browser UI.** A `/projects/:id/files` page lists a
  project's files with filtering by source, supports upload and
  download, and shows a "Add to project files" affordance on
  LLM-generated attachments in the chat view. A sidebar entry on the
  existing `/projects` page links into the per-project file browser.
- **Chat composer file upload.** The chat composer accepts one or
  more file attachments per message; attachments are uploaded via the
  same `POST /api/projects/:id/files` endpoint with
  `source = 'chat_upload'`, then attached to the outgoing message via
  the new `file_ids` field.

## Capabilities

### New Capabilities

- `project-files-api`: Backend persistence (SQLite `project_files`
  table, on-disk layout under a per-project directory), REST
  endpoints for upload / download / list / filter / delete, the
  `ProjectFileAccess` interface and its v1 implementation, and the
  LLM dispatch integration point.
- `project-files-frontend`: React-side API client, `/projects/:id/files`
  page (list + filter + upload + download + delete), and a sidebar
  link from the existing `/projects` page.
- `chat-files-frontend`: Chat composer file attachment UI
  (multi-file picker, pending attachments list, progress / error
  states), the "Add to project files" action on LLM-generated
  attachments surfaced from assistant messages, and display of file
  metadata on user and assistant bubbles when relevant.

### Modified Capabilities

- `chat-api`: Add optional `file_ids` (number[]) to
  `POST /api/chats/:id/messages` and `file_id` (number | null) to the
  returned message shape. `LlmRequest` is extended with a
  `projectFiles: ProjectFileRef[]` array (the interface-defined
  payload) so the LLM can see project files. No existing requirement
  is removed; this is additive.
- `chat-frontend`: Extend `sendMessage` to accept `file_ids`, render
  file chips on user bubbles, and surface a download link per chip.
  No existing chat-frontend requirement is removed; this is additive.

## Impact

- `backend/src/db.ts` — new `project_files` table + indexes; new
  optional `file_id` column on `chat_messages`.
- `backend/src/projects/` — new `filesRouter.ts`, `filesService.ts`,
  `filesRepo.ts`, `filesValidation.ts`, `storage.ts` (on-disk
  read/write helpers), `projectFileAccess.ts` (interface + v1
  whole-file implementation).
- `backend/src/chats/` — `chatsService.ts` and `chatsRouter.ts`
  accept `file_ids`; LLM dispatch calls `ProjectFileAccess` for the
  chat's project.
- `backend/src/llm/` — `LlmRequest` type gains `projectFiles`;
  provider clients pass it through unchanged (it never reaches the
  upstream wire).
- `backend/src/config.ts` — new config
  `projectFilesRoot: string` for the on-disk root (default
  `<dataDir>/project-files`).
- `backend/src/types/` — new `ProjectFile` and
  `ProjectFileRef` types.
- `frontend/src/api/` — new `projectFiles.ts` and additions to
  `chats.ts`.
- `frontend/src/pages/` — new `ProjectFilesPage.tsx`.
- `frontend/src/components/` — new `FileAttachmentPicker.tsx`,
  `FileChip.tsx`, `LlmFileAttachmentCard.tsx`; `MessageInput.tsx`
  and message bubble components extended to render attachments.
- `frontend/src/App.tsx` — new route `/projects/:id/files`; the
  `/projects` page gains a "Files" link per project.
- No new third-party dependencies; multipart parsing is handled with
  the existing Express + `multer` setup that `backend/package.json`
  already declares (otherwise we add `multer` as the only new dep
  and document it in the change).
