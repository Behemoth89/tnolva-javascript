## 1. Backend foundation

- [x] 1.1 Add `multer` to `backend/package.json` and run `npm install` in `backend/`
- [x] 1.2 Add `projectFilesRoot: string` to `config.ts` (default `<dataDir>/project-files`) and export from `config`
- [x] 1.3 Add the `project_files` table, the two indexes, the `chat_message_files` join table, the `chat_message_files` index, and the additive `file_id` column on `chat_messages` to `db.ts` `initDb`; wrap the `ALTER TABLE` in an idempotent guard matching the existing `migrateChatsAddProjectId` pattern
- [x] 1.4 Add a startup temp sweep that removes files under `<projectFilesRoot>/_tmp/` older than one hour

## 2. Project file storage backend

- [x] 2.1 Create `backend/src/projects/storage.ts` exporting `ensureProjectFilesRoot`, `getProjectDir(projectId)`, `getProjectFilePath(projectId, fileId, ext)`, `stageTempFile(buffer | stream)`, `commitTempToProject(tempPath, finalPath)`, `unlinkIfExists(path)`, and `removeProjectDir(projectId)`
- [x] 2.2 Implement MIME sniffing in `backend/src/projects/mime.ts` reading the first 16 KB of a file and returning `{ mimeType, ext }` from a small built-in signature table (PNG, JPEG, GIF, PDF, plain text, markdown, JSON, CSV, XML, JS, TS, HTML, ZIP); fall back to `{ mimeType: 'application/octet-stream', ext: '' }`
- [x] 2.3 Create `backend/src/projects/projectFilesRepo.ts` with the prepared statements: `insertProjectFile`, `getProjectFileById`, `listProjectFiles({ projectId, source?, limit, offset })` returning `{ items, total }`, `deleteProjectFile(id)`, `attachFileToMessage({ messageId, fileId, position })`, `setMessageFirstFile({ messageId, fileId })`, `getMessageFileIds(messageId)`, `getProjectFileIdsForMessages(messageIds)`
- [x] 2.4 Create `backend/src/projects/projectFilesService.ts` with `uploadFile({ projectId, userId, buffer, originalFilename, declaredMimeType, source })`, `listFiles(...)`, `downloadFile({ fileId, userId })`, `deleteFile({ fileId, userId })`, `saveLlmGeneratedFile({ projectId, userId, chatId, messageId, attachmentIndex })`. `uploadFile` MUST use `multer.diskStorage` with the temp dir, call the MIME sniffer, and on success atomically rename into the per-project directory; failures MUST unlink the temp file
- [x] 2.5 Create `backend/src/projects/filesValidation.ts` exporting `validateFilePart`, `validateFileIds`, `validateSaveFromMessageBody`, `validateSource` (must be one of `'project_upload' | 'chat_upload' | 'llm_generated'`)
- [x] 2.6 Create `backend/src/projects/filesRouter.ts` with the five routes: `POST /api/projects/:id/files` (multer, 25 MB cap, 400/404/413), `GET /api/projects/:id/files` (list, source filter, pagination), `GET /api/projects/files/:fileId` (download, 410 on missing), `DELETE /api/projects/files/:fileId` (transactional unlink), `POST /api/projects/:id/files/from-message` (LLM-generated, 413/404/400). All routes use the existing `requireAuth` middleware; all routes return `{ "error": string }` on failure
- [x] 2.7 Wire the new router into `app.ts` (`app.use('/api/projects', projectsRouter)` already exists; ensure `filesRouter` is mounted under the same prefix) and ensure `projectFilesRoot` is created at startup

## 3. LLM file access interface

- [x] 3.1 Create `backend/src/projects/projectFileAccess.ts` exporting the `ProjectFileRef` and `ProjectFileAccess` interfaces per the spec
- [x] 3.2 Create `backend/src/projects/wholeFileProjectFileAccess.ts` with the budget logic (100k per file, 200k total) and the binary-skip rule. Use the existing `projectFilesRepo.listProjectFiles` with `limit: 1000` to bound the candidate set
- [x] 3.3 Bind `WholeFileProjectFileAccess` in `app.ts` (or a `container.ts` factory used by `app.ts`) so the chat service can resolve it via `app.get('projectFileAccess')` or an exported singleton

## 4. Chat backend integration

- [x] 4.1 Extend `LlmRequest` in `backend/src/llm/types.ts` with `projectFiles?: ProjectFileRef[]` (imported from `projects/projectFileAccess`)
- [x] 4.2 In `chatService.ts`, when handling `POST /api/chats/:id/messages`:
  - parse optional `file_ids: number[]` from the body
  - validate every id resolves to a `project_files` row in the chat's project (404 otherwise)
  - persist the user message, set `file_messages.file_id` to the first id (or NULL), and insert one `chat_message_files` row per id with `position = index`
  - call `projectFileAccess.resolveForLlm({ projectId, chatId, userMessage: content })` exactly once and pass the result on `LlmRequest.projectFiles`
  - for assistant messages, accept an optional `attachments` array on the inbound `LlmResponse` (or persist `attachments: []` when absent); the spec's structured-attachment field is reserved for a future provider capability
- [x] 4.3 Update `chatsRouter.ts` `GET /api/chats/:id` (and the response of `POST /api/chats/:id/messages`) to include `file_ids: number[]` (union of `file_id` + `chat_message_files`, in `position ASC`) and `attachments: AssistantAttachment[]` (empty array when absent) on every message
- [x] 4.4 Add `AssistantAttachment` to `backend/src/types/` and re-export it where chat types live
- [x] 4.5 Verify the three LLM provider clients (`openaiCompletions`, `openaiResponses`, `anthropic`) do NOT forward `projectFiles` to the upstream wire (they only use `model`, `system`, `messages`, etc.) — add an explicit comment in each client that `projectFiles` is opaque

## 5. Frontend API client

- [x] 5.1 Create `frontend/src/api/projectFiles.ts` with `listProjectFiles`, `uploadProjectFile`, `downloadProjectFileUrl`, `deleteProjectFile`, `saveLlmGeneratedFile`, and the `ProjectFile` / `ProjectFileListResponse` types per the spec
- [x] 5.2 Extend `frontend/src/api/chats.ts`:
  - `sendMessage` input accepts optional `file_ids: number[]`; the request body includes the field when present
  - `ChatMessage` gains `file_ids: number[]` (default `[]`) and `attachments: AssistantAttachment[]` (default `[]`); coerce missing wire values to the defaults
  - export the `AssistantAttachment` type

## 6. Frontend file browser page

- [x] 6.1 Create `frontend/src/pages/ProjectFilesPage.tsx` rendering the project name header, the source filter `<select>`, the file `<input type="file">` + Upload button, the file rows (filename, MIME type, size, source badge, created_at, Download button, Delete button with confirmation), and the error banner. Use the existing per-component `useState` + `useEffect` + manual `refresh()` pattern
- [x] 6.2 Register the route `/projects/:id/files` in `frontend/src/App.tsx`, wrapped in `RouteGuard`
- [x] 6.3 Add a "Files" link per project in the existing `/projects` page (`ProjectsListPage` or equivalent) navigating to `/projects/<id>/files`
- [x] 6.4 Add a "Project files" nav link to `NavBar` for authenticated users (or wire the link from the `/projects` page; the spec's existing `/projects` page is the source of the per-project link)

## 7. Chat composer + message bubble UI

- [x] 7.1 Create `frontend/src/components/FileAttachmentPicker.tsx` rendering a `<input type="file" multiple>`, the pending-attachment chips row, the per-file `×` remove affordance, and the "uploading…" disabled state. The picker accepts the `accept` list documented in the spec
- [x] 7.2 Create `frontend/src/components/FileChip.tsx` rendering a single chip with filename + download link (calls `downloadProjectFileUrl`) and the per-message-style variant for user bubbles
- [x] 7.3 Wire the composer (`MessageInput.tsx`):
  - add the `<FileAttachmentPicker>` below the textarea
  - on submit, upload each pending file sequentially via `uploadProjectFile(projectId, file, { source: 'chat_upload' })`, collect ids, then call `sendMessage(chatId, { content, file_ids: ids })`
  - disable submit while uploads or `sendMessage` is in flight
  - on upload failure mid-batch, abort the send and surface the error; do not roll back already-uploaded files
  - post-upload `×` clicks call `deleteProjectFile(id)` to clean up
- [x] 7.4 Extend the user-bubble component to render `FileChip` for each entry in `message.file_ids` (in `position` order)
- [x] 7.5 Create `frontend/src/components/LlmFileAttachmentCard.tsx` rendering an assistant message's `attachments[i]` as a card with filename, MIME type, and an "Add to project files" button
- [x] 7.6 Extend the assistant-bubble component to render `LlmFileAttachmentCard` for each entry in `message.attachments`. On click, call `saveLlmGeneratedFile(projectId, { chat_id, message_id, attachment_index: i })`; on success replace the button with a "Saved" badge and a download link; on failure surface the error

## 8. Tests

- [x] 8.1 Backend unit tests for `storage.ts` (rename atomic, unlink missing, sweep), `mime.ts` (each signature), and `wholeFileProjectFileAccess.ts` (per-file cap, total cap, binary skip, empty project)
- [x] 8.2 Backend integration tests (Supertest) for the five `filesRouter` routes: upload happy path, upload oversized (413), upload wrong project (404), list + source filter + pagination, download (200), download non-owner (404), download missing-on-disk (410), delete (204), `/from-message` happy path, `/from-message` non-owner (404), `/from-message` oversized attachment (413), `/from-message` user message (400)
- [x] 8.3 Backend integration test for `POST /api/chats/:id/messages` with `file_ids`: file_ids recorded on the message + `chat_message_files` rows, wrong-project file_ids returns 404, no file_ids is unchanged
- [x] 8.4 Backend integration test for `LlmRequest.projectFiles`: chat with project files sets the field; chat without project files leaves it empty; the upstream request body for each provider does NOT contain `projectFiles` (asserted via mocked provider)
- [x] 8.5 Frontend component tests: `ProjectFilesPage` (list, filter, upload, download link, delete confirm), `FileAttachmentPicker` (multi-pick, per-file remove pre-upload, in-flight state, post-upload remove), `LlmFileAttachmentCard` (button → Saved badge on success, error on failure, never auto-invokes)
- [x] 8.6 Frontend API-client tests: `uploadProjectFile` posts multipart with `source = 'chat_upload'`, `saveLlmGeneratedFile` posts the right body, `sendMessage` forwards `file_ids`
- [x] 8.7 Run `npm test` in `backend/` and `npm test` in `frontend/` and confirm both exit `0`

## 9. Verification

- [x] 9.1 Run `openspec validate project-file-storage --strict` and resolve any reported issues
- [x] 9.2 Manually exercise: upload a file from the project files page, upload a file in a chat composer and confirm it shows up in the project's `chat_upload` files, send a chat message and confirm the user bubble shows the chip, click "Add to project files" on an LLM-generated attachment, delete a project file from the page, delete a project and confirm the on-disk directory is gone
- [x] 9.3 Run the backend's `npm run lint` (or equivalent) and the frontend's `npm run lint` if available; resolve any reported issues (no lint scripts configured; relying on `tsc` + `openspec validate --strict` instead)
