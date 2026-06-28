# project-frontend Specification

## Purpose

Define the React-side project management experience: an API client
that mirrors the `project-api` REST surface, a `/projects` page
where users list, create, rename, delete, and set their default
project, an admin `/admin/project-templates` page where admins
list, create, edit, and delete project templates and set the
default, and a project switcher in the chat panel that surfaces
the active project for the current view. The page consumes the
`project-api` REST surface, follows the per-component `useState`
+ `useEffect` + manual `refresh()` pattern used by every other
page in the app, and uses the existing `RouteGuard` + client-side
`is_admin` pattern for the admin route.

## ADDED Requirements

### Requirement: projects API client mirrors the backend REST surface

The frontend SHALL provide `frontend/src/api/projects.ts`
exporting the types `Project` and `ProjectTemplate` and the async
functions:

- `listProjects(): Promise<Project[]>`
- `getProject(id: number): Promise<Project>`
- `getDefaultProject(): Promise<Project>`
- `createProject(input: { name: string;
  system_prompt?: string | null;
  default_llm_provider_model: string }): Promise<Project>`
- `updateProject(id: number, input: { name?: string;
  system_prompt?: string | null;
  default_llm_provider_model?: string }): Promise<Project>`
- `makeDefaultProject(id: number): Promise<Project>`
- `deleteProject(id: number): Promise<void>`

And for the admin template surface:

- `listProjectTemplates(): Promise<ProjectTemplate[]>`
- `createProjectTemplate(input: { name: string;
  system_prompt?: string | null;
  default_llm_provider_model: string;
  is_default?: boolean }): Promise<ProjectTemplate>`
- `updateProjectTemplate(id: number, input: {
  name?: string; system_prompt?: string | null;
  default_llm_provider_model?: string;
  is_default?: boolean }): Promise<ProjectTemplate>`
- `deleteProjectTemplate(id: number): Promise<void>`

All `fetch` calls SHALL use `credentials: "include"`. All
functions SHALL throw on non-2xx with an `Error` whose
`.message` is the server's `error` field when present, otherwise
a generic `"Request failed with status <code>"` message. The
`Project` and `ProjectTemplate` types SHALL mirror the backend
response fields (`id`, `user_id`, `name`, `system_prompt`,
`default_llm_provider_model`, `is_user_default` for `Project`;
`is_default` for `ProjectTemplate`; `created_at`, `updated_at`).

#### Scenario: listProjects calls the right URL

- **WHEN** `listProjects()` is called
- **THEN** a `GET /api/projects` request is issued
- **AND** the request includes `credentials: "include"`

#### Scenario: createProject posts a JSON body

- **WHEN** `createProject({ name: "x",
  default_llm_provider_model: "anthropic:claude-sonnet-4-6" })`
  is called
- **THEN** a `POST` is sent to `/api/projects` with
  `Content-Type: application/json` and the JSON body
  `{ name: "x",
  default_llm_provider_model: "anthropic:claude-sonnet-4-6" }`

#### Scenario: error message is derived from server

- **WHEN** the server responds with 400 and
  `{ "error": "Invalid provider_model" }`
- **THEN** the promise rejects with an `Error` whose
  `.message === "Invalid provider_model"`

#### Scenario: deleteProject is a no-body DELETE

- **WHEN** `deleteProject(7)` is called
- **THEN** a `DELETE /api/projects/7` is issued with
  `credentials: "include"` and no body

### Requirement: Projects page lists, creates, renames, deletes, sets default

The frontend SHALL render a `/projects` route. The route SHALL be
wrapped in `RouteGuard`; unauthenticated users are redirected to
`/login` and the page never makes an API call. The page SHALL
display a list of the current user's projects (one row per
project) with columns / fields: name, system prompt (truncated
preview or `(none)`), default model, and a "default" badge on
the project with `is_user_default = 1`.

The page SHALL provide:

- A "New project" form with `name`, `system_prompt`, and a model
  selector (populated from the existing `listProviderModels`
  cross product used in the chat panel). Submitting calls
  `createProject` and refreshes the list.
- An inline rename control on each row: clicking the name swaps
  it for an `<input>` that commits on **Enter** and cancels on
  **Escape** (matching the chat-title pattern).
- A "Set as default" button on every non-default project that
  calls `makeDefaultProject` and refreshes the list.
- A "Delete" button on every non-default project that calls
  `deleteProject` and refreshes the list. The default project's
  row SHALL NOT show a Delete button.
- An error banner for any 4xx / 5xx response showing the server's
  `error` string.

#### Scenario: project list is fetched on mount

- **WHEN** the user navigates to `/projects` and is authenticated
- **THEN** the page renders
- **AND** `listProjects()` is called
- **AND** the list shows the returned projects

#### Scenario: new project is created and shown

- **WHEN** the user fills the form and submits
- **THEN** `createProject` is called with the form values
- **AND** on success the new project appears in the list
- **AND** the form is reset

#### Scenario: default project shows the badge and no delete button

- **WHEN** the list includes a project with `is_user_default = 1`
- **THEN** that row shows a "Default" badge
- **AND** that row does NOT render a Delete button

#### Scenario: setting a project as default updates the badges

- **WHEN** the user clicks "Set as default" on a non-default
  project
- **THEN** `makeDefaultProject(id)` is called
- **AND** on success the previously-default project no longer
  shows the badge
- **AND** the clicked project shows the badge

#### Scenario: deleting a non-default project removes it

- **WHEN** the user clicks "Delete" on a non-default project
- **THEN** `deleteProject(id)` is called
- **AND** on success the row is removed from the list
- **AND** the default project's chats are unaffected

#### Scenario: 409 on default delete is surfaced

- **WHEN** the server returns 409 from a delete attempt
  (defensive: the UI does not surface the button, but a direct
  API call may)
- **THEN** the error banner shows the server's `error` string

#### Scenario: anonymous user is redirected

- **WHEN** an unauthenticated user navigates to `/projects`
- **THEN** the browser URL changes to `/login`
- **AND** no `/api/projects` request is issued

### Requirement: Admin project templates page lists, creates, edits, deletes, sets default

The frontend SHALL render a `/admin/project-templates` route. The
route SHALL be wrapped in `RouteGuard` and SHALL additionally
render an "Admin privileges required" denial (and SHALL NOT call
any `/api/admin/project-templates/*` endpoint) when the current
user's `is_admin` is not 1, matching the existing
`/admin/llm-providers` pattern.

The page SHALL display a list of project templates with columns /
fields: name, system prompt, default model, and a "default" badge
on the template with `is_default = 1`. The page SHALL provide:

- A "New template" form with `name`, `system_prompt`, a model
  selector, and a checkbox "Set as default template". Submitting
  calls `createProjectTemplate` and refreshes the list.
- An edit control (modal or inline) that calls
  `updateProjectTemplate` and refreshes the list. The edit
  control SHALL include a "Set as default template" checkbox.
- A "Set as default" button on every non-default template that
  calls `updateProjectTemplate(id, { is_default: true })` and
  refreshes the list.
- A "Delete" button on every template that calls
  `deleteProjectTemplate` and refreshes the list. A confirmation
  prompt SHALL appear before the delete is issued.

#### Scenario: admin lists templates on mount

- **WHEN** an admin navigates to `/admin/project-templates`
- **THEN** the page renders
- **AND** `listProjectTemplates()` is called
- **AND** the list shows the returned templates

#### Scenario: non-admin sees the denial

- **WHEN** a non-admin authenticated user navigates to
  `/admin/project-templates`
- **THEN** the page renders the "Admin privileges required"
  message
- **AND** no `/api/admin/project-templates` request is issued

#### Scenario: creating a default template clears the previous default

- **WHEN** a default template exists
- **AND** the admin creates a new template with "Set as default
  template" checked
- **THEN** the new template appears with the Default badge
- **AND** the previously-default template no longer has the badge

#### Scenario: deleting a template asks for confirmation

- **WHEN** the admin clicks "Delete" on a template
- **THEN** a confirmation prompt is shown
- **AND** on confirm, `deleteProjectTemplate(id)` is called
- **AND** on success the row is removed

### Requirement: chat panel shows the active project and a project switcher

The `ChatPanel` SHALL render the active project's name in the
chat header (next to or beneath the existing title control). The
header SHALL include a project switcher (a `<select>` populated
by `listProjects()`) whose current value is the active project's
`id`. The switcher SHALL be disabled while a project list fetch
is in flight. The switcher's value is a piece of local display
state; the chat panel SHALL NOT pass `project_id` to
`createChat` (the backend's user-default rule places new chats in
the user's user-default project automatically).

#### Scenario: switcher lists the user's projects

- **WHEN** the user has three projects
- **AND** the chat panel mounts
- **THEN** the switcher shows the three project names
- **AND** the switcher's current value is the project whose
  `is_user_default = 1` on first render

#### Scenario: switching the dropdown updates the displayed name

- **WHEN** the user picks a different project from the switcher
- **THEN** the chat header's project name updates immediately
- **AND** no API call is issued
- **AND** the next "new chat" call still creates the chat in
  the user's user-default project (the switcher is display-only
  in v1)

#### Scenario: switcher is disabled while loading

- **WHEN** `listProjects()` is in flight
- **THEN** the switcher is disabled
- **AND** it re-enables when the list resolves

### Requirement: nav links for /projects and /admin/project-templates

The existing `NavBar` SHALL render a "Projects" link visible to
every authenticated user, and an "Admin → Project templates"
link visible only when the current user's `is_admin` is 1. The
admin link SHALL follow the same admin-gating pattern used by
the existing "Admin → LLM providers" link.

#### Scenario: authenticated user sees Projects link

- **WHEN** an authenticated user is on any page
- **THEN** the nav bar shows a "Projects" link
- **AND** clicking it navigates to `/projects`

#### Scenario: admin sees the project templates admin link

- **WHEN** an admin user is on any page
- **THEN** the nav bar shows an "Admin → Project templates" link
- **AND** clicking it navigates to `/admin/project-templates`

#### Scenario: non-admin does not see the admin link

- **WHEN** a non-admin authenticated user is on any page
- **THEN** the nav bar does NOT show the "Admin → Project
  templates" link
- **AND** navigating directly to `/admin/project-templates`
  shows the "Admin privileges required" denial
