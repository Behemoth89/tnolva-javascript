# llm-provider-admin Specification

## Purpose

Define the backend admin REST API and SQLite persistence for LLM
providers and the models they expose. Providers and their models form a
one-to-many catalog: a chat request will eventually need to resolve a
configured provider + model to dispatch a prompt upstream. This spec
covers the admin-managed configuration surface only — request-time LLM
dispatch is out of scope.

## Requirements

### Requirement: llm_providers table schema

The backend SHALL persist LLM providers in a SQLite table
`llm_providers` with the following columns:

- `id` — `INTEGER PRIMARY KEY AUTOINCREMENT`
- `name` — `TEXT NOT NULL` with `UNIQUE` constraint, max length 128
- `url` — `TEXT NOT NULL`, max length 512
- `api_key` — `TEXT NOT NULL`, max length 512
- `type` — `TEXT NOT NULL` constrained to one of the values
  `openai_completions`, `openai_responses`, `anthropic`
- `created_at` — `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

The `name` column SHALL be unique. Two providers SHALL NOT share a name.

#### Scenario: schema is created on first startup

- **WHEN** the backend process starts against a fresh SQLite file
- **THEN** the `llm_providers` table exists with the columns and
  constraints above

#### Scenario: schema creation is idempotent

- **WHEN** the backend process starts against a SQLite file that already
  has the `llm_providers` table
- **THEN** startup does not fail and the existing table is preserved

#### Scenario: provider name is unique

- **WHEN** a provider with `name === "openai-prod"` already exists
- **AND** an attempt is made to insert another provider with the same
  name
- **THEN** the insert fails with a unique-constraint violation

### Requirement: llm_provider_models table schema

The backend SHALL persist LLM provider models in a SQLite table
`llm_provider_models` with the following columns:

- `id` — `INTEGER PRIMARY KEY AUTOINCREMENT`
- `llm_provider_id` — `INTEGER NOT NULL` with a `FOREIGN KEY` reference
  to `llm_providers(id)` configured with `ON DELETE CASCADE`
- `name` — `TEXT NOT NULL`, max length 128
- `created_at` — `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

The combination `(llm_provider_id, name)` SHALL be unique: a provider
SHALL NOT have two models with the same name.

#### Scenario: schema is created on first startup

- **WHEN** the backend process starts against a fresh SQLite file
- **THEN** the `llm_provider_models` table exists with the columns,
  foreign key, and unique constraint above

#### Scenario: schema creation is idempotent

- **WHEN** the backend process starts against a SQLite file that already
  has the `llm_provider_models` table
- **THEN** startup does not fail and the existing table is preserved

#### Scenario: model name is unique per provider

- **WHEN** provider with `id === 1` already has a model with
  `name === "gpt-4o"`
- **AND** an attempt is made to insert another model on the same
  provider with `name === "gpt-4o"`
- **THEN** the insert fails with a unique-constraint violation

#### Scenario: same model name allowed across different providers

- **WHEN** provider `1` has a model `name === "gpt-4o"`
- **AND** provider `2` does not have a model with that name
- **THEN** inserting a model `name === "gpt-4o"` on provider `2` succeeds

#### Scenario: deleting a provider cascades to its models

- **WHEN** provider with `id === 1` has models
- **AND** provider `id === 1` is deleted
- **THEN** all rows in `llm_provider_models` with `llm_provider_id
  === 1` are removed

### Requirement: Admin-only LLM provider CRUD endpoints

The backend SHALL expose the following endpoints under
`/api/admin/llm-providers`, each guarded by `requireAuth` and
`requireAdmin`:

- `GET /api/admin/llm-providers` — list all providers
- `GET /api/admin/llm-providers/:id` — fetch a single provider
- `POST /api/admin/llm-providers` — create a provider
- `PUT /api/admin/llm-providers/:id` — update a provider
- `DELETE /api/admin/llm-providers/:id` — delete a provider

#### Scenario: admin lists providers

- **WHEN** an admin user sends `GET /api/admin/llm-providers`
- **THEN** the response status is `200`
- **AND** the response body is a JSON array

#### Scenario: admin fetches a provider

- **WHEN** an admin user sends `GET /api/admin/llm-providers/:id` for
  an existing provider
- **THEN** the response status is `200`
- **AND** the response body has `id`, `name`, `url`, `type`, and
  `created_at` fields

#### Scenario: admin creates a provider

- **WHEN** an admin user posts a valid provider body to
  `POST /api/admin/llm-providers`
- **THEN** the response status is `201`
- **AND** the response body has `id`, `name`, `url`, `type`, and
  `created_at` fields
- **AND** a row exists in `llm_providers` with those values

#### Scenario: admin updates a provider

- **WHEN** an admin user sends `PUT /api/admin/llm-providers/:id` with
  a valid body for an existing provider
- **THEN** the response status is `200`
- **AND** the row in `llm_providers` is updated with the new values

#### Scenario: admin deletes a provider

- **WHEN** an admin user sends `DELETE /api/admin/llm-providers/:id`
  for an existing provider
- **THEN** the response status is `204`
- **AND** the row is removed from `llm_providers`

#### Scenario: non-admin is forbidden

- **WHEN** a non-admin authenticated user sends any request to
  `/api/admin/llm-providers/...`
- **THEN** the response status is `403`

#### Scenario: anonymous is unauthorized

- **WHEN** a client without a valid session sends any request to
  `/api/admin/llm-providers/...`
- **THEN** the response status is `401`

### Requirement: Provider validation rules

The backend SHALL validate POST and PUT bodies against the following
rules and respond `400` with an `error` field on failure:

- `name` — required, non-empty string, max length 128
- `url` — required, non-empty string, max length 512
- `api_key` — required on POST, optional on PUT; when present,
  non-empty string, max length 512
- `type` — required, MUST be one of `openai_completions`,
  `openai_responses`, `anthropic`

#### Scenario: name too long rejected

- **WHEN** an admin posts a provider body with `name.length > 128`
- **THEN** the response status is `400`
- **AND** the response body's `error` field mentions the name length
- **AND** no row is inserted

#### Scenario: url too long rejected

- **WHEN** an admin posts a provider body with `url.length > 512`
- **THEN** the response status is `400`
- **AND** no row is inserted

#### Scenario: api_key too long rejected

- **WHEN** an admin posts a provider body with
  `api_key.length > 512`
- **THEN** the response status is `400`
- **AND** no row is inserted

#### Scenario: invalid type rejected

- **WHEN** an admin posts a provider body with
  `type === "bogus_provider"`
- **THEN** the response status is `400`
- **AND** the response body's `error` field mentions the allowed types
- **AND** no row is inserted

#### Scenario: missing required fields rejected

- **WHEN** an admin posts a body missing `name`, `url`, `api_key`, or
  `type`
- **THEN** the response status is `400`
- **AND** no row is inserted

### Requirement: Provider api_key is never echoed in API responses

The backend SHALL NOT include the `api_key` field's plaintext value in
any response body for the LLM provider endpoints. GET list and GET
by-id responses SHALL either omit the `api_key` field entirely or
return a redacted placeholder (e.g. `"********"`). POST and PUT
responses SHALL omit `api_key`.

#### Scenario: list response redacts api_key

- **WHEN** an admin user sends `GET /api/admin/llm-providers`
- **THEN** no element in the response array has the plaintext
  `api_key` value
- **AND** if `api_key` is present on an element, it equals the
  redacted placeholder

#### Scenario: single response redacts api_key

- **WHEN** an admin user sends `GET /api/admin/llm-providers/:id` for
  an existing provider
- **THEN** the response body does not contain the plaintext `api_key`

#### Scenario: create response omits api_key

- **WHEN** an admin user creates a provider with `api_key = "sk-xyz"`
- **THEN** the response status is `201`
- **AND** the response body does not contain the string `"sk-xyz"`
- **AND** the response body does not contain a field `api_key` whose
  value matches the submitted secret

### Requirement: Provider not found and conflict responses

The backend SHALL return:

- HTTP `404` with `{ "error": "Provider not found" }` for GET-by-id,
  PUT, or DELETE when `:id` does not exist
- HTTP `409` with `{ "error": "Provider name already exists" }` for
  POST or PUT when the supplied `name` is already used by another
  provider

#### Scenario: update nonexistent provider

- **WHEN** an admin user sends `PUT /api/admin/llm-providers/999`
- **THEN** the response status is `404`

#### Scenario: delete nonexistent provider

- **WHEN** an admin user sends `DELETE /api/admin/llm-providers/999`
- **THEN** the response status is `404`

#### Scenario: create with duplicate name

- **WHEN** a provider with `name === "openai-prod"` already exists
- **AND** an admin posts a new provider with the same `name`
- **THEN** the response status is `409`
- **AND** no second row is inserted

### Requirement: Admin-only LLM provider model CRUD endpoints

The backend SHALL expose the following endpoints under
`/api/admin/llm-provider-models`, each guarded by `requireAuth` and
`requireAdmin`:

- `GET /api/admin/llm-provider-models` — list all models
- `GET /api/admin/llm-provider-models/:id` — fetch a single model
- `POST /api/admin/llm-provider-models` — create a model
- `PUT /api/admin/llm-provider-models/:id` — update a model
- `DELETE /api/admin/llm-provider-models/:id` — delete a model

#### Scenario: admin lists models

- **WHEN** an admin user sends `GET /api/admin/llm-provider-models`
- **THEN** the response status is `200`
- **AND** the response body is a JSON array

#### Scenario: admin filters models by provider

- **WHEN** an admin user sends
  `GET /api/admin/llm-provider-models?provider_id=1`
- **THEN** the response status is `200`
- **AND** the response body contains only models with
  `llm_provider_id === 1`

#### Scenario: admin fetches a model

- **WHEN** an admin user sends
  `GET /api/admin/llm-provider-models/:id` for an existing model
- **THEN** the response status is `200`
- **AND** the response body has `id`, `llm_provider_id`, `name`, and
  `created_at` fields

#### Scenario: admin creates a model

- **WHEN** an admin user posts a valid model body to
  `POST /api/admin/llm-provider-models` referencing an existing
  `llm_provider_id`
- **THEN** the response status is `201`
- **AND** a row exists in `llm_provider_models` with the supplied
  values

#### Scenario: admin updates a model

- **WHEN** an admin user sends
  `PUT /api/admin/llm-provider-models/:id` with a valid body
- **THEN** the response status is `200`
- **AND** the row in `llm_provider_models` reflects the new values

#### Scenario: admin deletes a model

- **WHEN** an admin user sends
  `DELETE /api/admin/llm-provider-models/:id` for an existing model
- **THEN** the response status is `204`
- **AND** the row is removed

#### Scenario: non-admin is forbidden

- **WHEN** a non-admin authenticated user sends any request to
  `/api/admin/llm-provider-models/...`
- **THEN** the response status is `403`

#### Scenario: anonymous is unauthorized

- **WHEN** a client without a valid session sends any request to
  `/api/admin/llm-provider-models/...`
- **THEN** the response status is `401`

### Requirement: Model validation rules

The backend SHALL validate POST and PUT bodies against the following
rules and respond `400` with an `error` field on failure:

- `llm_provider_id` — required, integer, MUST reference an existing
  provider
- `name` — required, non-empty string, max length 128

#### Scenario: missing llm_provider_id rejected

- **WHEN** an admin posts a model body missing `llm_provider_id`
- **THEN** the response status is `400`
- **AND** no row is inserted

#### Scenario: nonexistent llm_provider_id rejected

- **WHEN** an admin posts a model body with `llm_provider_id === 999`
  that does not exist
- **THEN** the response status is `400`
- **AND** the response body's `error` field mentions the provider
- **AND** no row is inserted

#### Scenario: name too long rejected

- **WHEN** an admin posts a model body with `name.length > 128`
- **THEN** the response status is `400`
- **AND** no row is inserted

### Requirement: Model not found and conflict responses

The backend SHALL return:

- HTTP `404` with `{ "error": "Model not found" }` for GET-by-id, PUT,
  or DELETE when `:id` does not exist
- HTTP `409` with
  `{ "error": "Model name already exists for this provider" }` for POST
  or PUT when a model with the same `name` already exists on the
  referenced provider

#### Scenario: update nonexistent model

- **WHEN** an admin user sends
  `PUT /api/admin/llm-provider-models/999`
- **THEN** the response status is `404`

#### Scenario: delete nonexistent model

- **WHEN** an admin user sends
  `DELETE /api/admin/llm-provider-models/999`
- **THEN** the response status is `404`

#### Scenario: create with duplicate name on same provider

- **WHEN** provider `1` already has a model `name === "gpt-4o"`
- **AND** an admin posts a new model on provider `1` with the same
  `name`
- **THEN** the response status is `409`
- **AND** no second row is inserted
