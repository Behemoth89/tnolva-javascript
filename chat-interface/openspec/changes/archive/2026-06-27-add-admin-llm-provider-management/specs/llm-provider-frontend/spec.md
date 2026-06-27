# llm-provider-frontend Specification

## Purpose

Define the React admin experience for managing LLM providers and the
models they expose: an API client that mirrors the backend contract, a
providers page with create/edit/delete, a models page with
create/edit/delete plus a provider selector, navigation links visible
only to admins, and the same `RouteGuard` + client-side `is_admin`
guard pattern used by the existing `/admin` users page.

## Requirements

### Requirement: API client for LLM provider endpoints

The frontend SHALL provide an `llmProviders` API client module that
exposes the following functions, each returning a Promise and using
`credentials: "include"`:

- `listProviders()` — `GET /api/admin/llm-providers`
- `getProvider(id)` — `GET /api/admin/llm-providers/:id`
- `createProvider(input)` — `POST /api/admin/llm-providers`
- `updateProvider(id, input)` — `PUT /api/admin/llm-providers/:id`
- `deleteProvider(id)` — `DELETE /api/admin/llm-providers/:id`
- `listModels(providerId?)` — `GET /api/admin/llm-provider-models`,
  optionally with `?provider_id=`
- `getModel(id)` — `GET /api/admin/llm-provider-models/:id`
- `createModel(input)` — `POST /api/admin/llm-provider-models`
- `updateModel(id, input)` — `PUT /api/admin/llm-provider-models/:id`
- `deleteModel(id)` — `DELETE /api/admin/llm-provider-models/:id`

The client SHALL treat any non-2xx response as a rejected promise whose
`Error.message` is the server's `error` field when present, otherwise
a generic `"Request failed with status <code>"` message.

#### Scenario: createProvider posts JSON body

- **WHEN** `createProvider({ name, url, api_key, type })` is called
- **THEN** a `POST` is sent to `/api/admin/llm-providers` with
  `Content-Type: application/json` and the JSON body
  `{ name, url, api_key, type }`

#### Scenario: createProvider returns the created provider

- **WHEN** the server responds with `201` and a provider body
- **THEN** `createProvider` resolves with the parsed provider object

#### Scenario: error message is derived from server

- **WHEN** the server responds with `400` and
  `{ "error": "Invalid type" }`
- **THEN** the promise from `createProvider` rejects with an `Error`
  whose `.message === "Invalid type"`

### Requirement: Admin providers page lists, creates, edits, deletes

The frontend SHALL render a `/admin/llm-providers` route. The route
SHALL be wrapped in `RouteGuard` and SHALL additionally render an
"Admin privileges required" denial (and SHALL NOT call any
`/api/admin/llm-providers/*` endpoint) when the current user's
`is_admin !== 1`.

When the user is an admin, the page SHALL:

- On mount, call `listProviders()` and display the resulting providers
  in a table with columns: `ID`, `Name`, `Type`, `URL`, `Created at`
- Expose a "New provider" form accepting `name`, `url`, `api_key`, and
  `type` (a select with the three allowed values). On submit, the form
  calls `createProvider(...)` and on success refreshes the list
- For each row, expose an "Edit" action that loads that provider's
  current values into a form; on submit the form calls
  `updateProvider(id, ...)` and on success refreshes the list. The
  edit form SHALL allow leaving `api_key` blank; when blank, the
  existing `api_key` is preserved
- For each row, expose a "Delete" action that calls
  `deleteProvider(id)` and on success refreshes the list

While a request is in flight, the page SHALL disable the relevant
submit button. On any rejected promise the page SHALL display the
`Error.message` inline as an alert.

#### Scenario: admin sees providers list

- **WHEN** an admin user navigates to `/admin/llm-providers`
- **THEN** the page renders a table with one row per provider

#### Scenario: non-admin sees denial

- **WHEN** a non-admin user navigates to `/admin/llm-providers`
- **THEN** the page renders an "Admin privileges required" message
- **AND** no request to `/api/admin/llm-providers` is made

#### Scenario: admin creates a provider

- **WHEN** an admin submits the new-provider form with valid values
- **THEN** a `POST /api/admin/llm-providers` is sent
- **AND** on success the providers list refreshes to include the new
  row

#### Scenario: admin edits a provider

- **WHEN** an admin submits the edit form for an existing provider
  with a new name
- **THEN** a `PUT /api/admin/llm-providers/:id` is sent
- **AND** on success the providers list refreshes to reflect the new
  name

#### Scenario: admin deletes a provider

- **WHEN** an admin clicks the Delete action for a provider
- **THEN** a `DELETE /api/admin/llm-providers/:id` is sent
- **AND** on success the providers list refreshes and the row is gone

#### Scenario: server error is shown inline

- **WHEN** an admin submits the new-provider form and the server
  responds `400` with `{ "error": "Invalid type" }`
- **THEN** the page displays the inline alert text "Invalid type"

### Requirement: Admin provider models page lists, creates, edits, deletes

The frontend SHALL render a `/admin/llm-provider-models` route. The
route SHALL be wrapped in `RouteGuard` and SHALL additionally render
an "Admin privileges required" denial when the current user's
`is_admin !== 1`.

When the user is an admin, the page SHALL:

- On mount, call `listProviders()` AND `listModels()` in parallel and
  display the resulting models in a table with columns: `ID`,
  `Provider`, `Name`, `Created at`
- Provide a provider selector (a select populated from
  `listProviders()`) so the operator can filter the table to one
  provider or see all providers. When a specific provider is selected,
  the table calls `listModels(providerId)`
- Expose a "New model" form with a `provider` select (populated from
  `listProviders()`) and a `name` text input. On submit the form calls
  `createModel({ llm_provider_id, name })` and on success refreshes
  the list
- For each row, expose an "Edit" action that loads that model's
  current values into a form; on submit the form calls
  `updateModel(id, { llm_provider_id, name })` and on success
  refreshes the list
- For each row, expose a "Delete" action that calls
  `deleteModel(id)` and on success refreshes the list

While a request is in flight, the relevant submit button is disabled.
On any rejected promise the page SHALL display the `Error.message`
inline as an alert.

#### Scenario: admin sees models list

- **WHEN** an admin user navigates to `/admin/llm-provider-models`
- **THEN** the page renders a table with one row per model
- **AND** the provider column shows the provider's name

#### Scenario: non-admin sees denial

- **WHEN** a non-admin user navigates to `/admin/llm-provider-models`
- **THEN** the page renders an "Admin privileges required" message
- **AND** no request to `/api/admin/llm-provider-models` is made

#### Scenario: admin filters by provider

- **WHEN** an admin selects a specific provider in the selector
- **THEN** `listModels(providerId)` is called
- **AND** the table displays only models belonging to that provider

#### Scenario: admin creates a model

- **WHEN** an admin submits the new-model form with a valid
  `llm_provider_id` and `name`
- **THEN** a `POST /api/admin/llm-provider-models` is sent
- **AND** on success the models list refreshes to include the new
  row

#### Scenario: admin deletes a model

- **WHEN** an admin clicks the Delete action for a model
- **THEN** a `DELETE /api/admin/llm-provider-models/:id` is sent
- **AND** on success the models list refreshes and the row is gone

### Requirement: Admin nav links to the new pages

The frontend SHALL render navigation links to `/admin/llm-providers`
and `/admin/llm-provider-models` alongside the existing `/admin` link.
Both links SHALL be rendered only when the auth context's user has
`is_admin === 1`.

#### Scenario: admin sees both nav links

- **WHEN** an admin user is logged in
- **THEN** the nav contains links to `/admin/llm-providers` and
  `/admin/llm-provider-models`

#### Scenario: non-admin does not see the new nav links

- **WHEN** a non-admin user is logged in
- **THEN** the nav does not contain links to `/admin/llm-providers`
  or `/admin/llm-provider-models`
