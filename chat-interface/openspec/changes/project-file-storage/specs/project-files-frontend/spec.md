# project-files-frontend Specification (delta)

## Purpose

Define the React-side project files experience: an API client
that mirrors the `project-files-api` REST surface and a
`/projects/:id/files` page where users list, filter, upload,
download, and delete the files belonging to one of their
projects. The page consumes the `project-files-api` REST
surface, follows the per-component `useState` + `useEffect` +
manual `refresh()` pattern used by every other page in the app,
and reuses the existing `RouteGuard` and the existing
`/projects` page's "Files" link to navigate into it.

## ADDED Requirements

### Requirement: project files API client mirrors the backend REST surface

The frontend SHALL provide
`frontend/src/api/projectFiles.ts` exporting the types
`ProjectFile` and `ProjectFileListResponse` and the async
functions:

- `listProjectFiles(projectId: number, opts?: { source?:
  'project_upload' | 'chat_upload' | 'llm_generated'; limit?:
  number; offset?: number }): Promise<ProjectFileListResponse>`
- `uploadProjectFile(projectId: number, file: File, opts?: {
  source?: 'project_upload' | 'chat_upload' }): Promise<ProjectFile>`
- `downloadProjectFileUrl(fileId: number): string` —
  returns a relative URL (`/api/projects/files/<id>`) suitable
  for an `<a href>` / `window.open` with `credentials: 'include'`
  resolved at request time.
- `deleteProjectFile(fileId: number): Promise<void>`
- `saveLlmGeneratedFile(projectId: number, input: {
  chat_id: number; message_id: number; attachment_index: number
  }): Promise<ProjectFile>`

`ProjectFile` SHALL mirror the backend response fields
(`id`, `project_id`, `filename`, `mime_type`, `size_bytes`,
`source`, `source_chat_id`, `source_message_id`, `created_at`,
`updated_at`). `ProjectFileListResponse` SHALL mirror
`{ items, total, limit, offset }`. `uploadProjectFile` SHALL
use `FormData` with a `file` part and an optional `source` part,
posting to `/api/projects/<id>/files` with `credentials:
'include'`. All non-upload functions SHALL use `fetch` with
`credentials: 'include'`. All functions SHALL throw on non-2xx
with an `Error` whose `.message` is the server's `error` field
when present, otherwise a generic
`"Request failed with status <code>"` message.

#### Scenario: listProjectFiles calls the right URL

- **WHEN** `listProjectFiles(7)` is called
- **THEN** a `GET /api/projects/7/files` request is issued
- **AND** the request includes `credentials: 'include'`

#### Scenario: listProjectFiles with a source filter

- **WHEN** `listProjectFiles(7, { source: 'chat_upload' })` is
  called
- **THEN** a `GET /api/projects/7/files?source=chat_upload`
  request is issued

#### Scenario: uploadProjectFile posts multipart

- **WHEN**
  `uploadProjectFile(7, file, { source: 'chat_upload' })` is
  called
- **THEN** a `POST` is sent to `/api/projects/7/files` with
  `Content-Type: multipart/form-data`, a `file` part carrying
  `file`, and a `source` part carrying `'chat_upload'`
- **AND** the request includes `credentials: 'include'`

#### Scenario: downloadProjectFileUrl is a relative path

- **WHEN** `downloadProjectFileUrl(42)` is called
- **THEN** the returned string is `'/api/projects/files/42'`

#### Scenario: error message is derived from server

- **WHEN** the server responds with 413 and
  `{ "error": "File too large" }`
- **THEN** the promise rejects with an `Error` whose
  `.message === 'File too large'`

### Requirement: ProjectFilesPage lists, filters, uploads, downloads, deletes

The frontend SHALL render a `/projects/:id/files` route. The
route SHALL be wrapped in `RouteGuard`; unauthenticated users
are redirected to `/login` and the page never makes an API
call. The page SHALL:

- Resolve the project's name (via `getProject(id)`) and display
  it in the page header.
- Show a list of the project's files (one row per file) with
  columns / fields: filename, MIME type, size (human-readable),
  source badge (`project_upload` / `chat_upload` /
  `llm_generated`), and `created_at` timestamp.
- Provide a source filter (`<select>` with values "All",
  "Project upload", "Chat upload", "LLM generated") that
  re-calls `listProjectFiles` with the corresponding
  `source` query.
- Provide a file `<input type="file">` and an "Upload" button
  that posts via `uploadProjectFile(id, file)` and refreshes
  the list.
- Provide a "Download" button per row that opens
  `downloadProjectFileUrl(fileId)` in a new tab (with
  `credentials: 'include'` so the auth cookie travels).
- Provide a "Delete" button per row that calls
  `deleteProjectFile(fileId)` and refreshes the list. A
  confirmation prompt SHALL appear before the delete is
  issued.
- Display an error banner for any 4xx / 5xx response showing
  the server's `error` string.
- Show a "Files" link in the existing `/projects` page
  (`ProjectsListPage` or equivalent) per project, navigating
  to `/projects/<id>/files`.

#### Scenario: file list is fetched on mount

- **WHEN** the user navigates to `/projects/7/files` and is
  authenticated
- **THEN** the page renders
- **AND** `listProjectFiles(7)` is called
- **AND** the list shows the returned files

#### Scenario: source filter narrows the list

- **WHEN** the user picks "Chat upload" from the source filter
- **THEN** `listProjectFiles(7, { source: 'chat_upload' })` is
  called
- **AND** the list shows only `source = 'chat_upload'` files

#### Scenario: upload adds a file to the list

- **WHEN** the user picks a 100 KB PNG and clicks "Upload"
- **THEN** `uploadProjectFile(7, file)` is called
- **AND** on success the new file appears at the top of the
  list

#### Scenario: download opens a new tab

- **WHEN** the user clicks "Download" on a file row
- **THEN** a new tab opens to `downloadProjectFileUrl(id)`
- **AND** the request includes the auth cookie

#### Scenario: delete asks for confirmation

- **WHEN** the user clicks "Delete" on a file row
- **THEN** a confirmation prompt is shown
- **AND** on confirm, `deleteProjectFile(id)` is called
- **AND** on success the row is removed

#### Scenario: 413 surfaces an error

- **WHEN** the server returns 413 from an upload
- **THEN** the error banner shows the server's `error` string

#### Scenario: anonymous user is redirected

- **WHEN** an unauthenticated user navigates to
  `/projects/7/files`
- **THEN** the browser URL changes to `/login`
- **AND** no `/api/projects/7/files` request is issued

#### Scenario: Projects page links to the file browser

- **WHEN** an authenticated user views `/projects`
- **THEN** every project row shows a "Files" link
- **AND** clicking the link navigates to
  `/projects/<project id>/files`
