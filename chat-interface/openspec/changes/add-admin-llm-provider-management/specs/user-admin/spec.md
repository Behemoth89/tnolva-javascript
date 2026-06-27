## ADDED Requirements

### Requirement: Admin-only LLM provider CRUD endpoints

The backend SHALL expose the following endpoints under
`/api/admin/llm-providers`, each guarded by `requireAuth` and
`requireAdmin`:

- `GET /api/admin/llm-providers` — list all providers
- `GET /api/admin/llm-providers/:id` — fetch a single provider
- `POST /api/admin/llm-providers` — create a provider
- `PUT /api/admin/llm-providers/:id` — update a provider
- `DELETE /api/admin/llm-providers/:id` — delete a provider

Request and response bodies, validation rules, and the `api_key`
redaction policy are defined in the `llm-provider-admin` specification.

#### Scenario: admin lists providers

- **WHEN** an admin user sends `GET /api/admin/llm-providers`
- **THEN** the response status is `200`
- **AND** the response body is a JSON array

#### Scenario: non-admin is forbidden

- **WHEN** a non-admin authenticated user sends any request to
  `/api/admin/llm-providers/...`
- **THEN** the response status is `403`

#### Scenario: anonymous is unauthorized

- **WHEN** a client without a valid session sends any request to
  `/api/admin/llm-providers/...`
- **THEN** the response status is `401`

### Requirement: Admin-only LLM provider model CRUD endpoints

The backend SHALL expose the following endpoints under
`/api/admin/llm-provider-models`, each guarded by `requireAuth` and
`requireAdmin`:

- `GET /api/admin/llm-provider-models` — list all models, optional
  `?provider_id=` filter
- `GET /api/admin/llm-provider-models/:id` — fetch a single model
- `POST /api/admin/llm-provider-models` — create a model
- `PUT /api/admin/llm-provider-models/:id` — update a model
- `DELETE /api/admin/llm-provider-models/:id` — delete a model

Request and response bodies and validation rules are defined in the
`llm-provider-admin` specification.

#### Scenario: admin lists models

- **WHEN** an admin user sends `GET /api/admin/llm-provider-models`
- **THEN** the response status is `200`
- **AND** the response body is a JSON array

#### Scenario: non-admin is forbidden

- **WHEN** a non-admin authenticated user sends any request to
  `/api/admin/llm-provider-models/...`
- **THEN** the response status is `403`

#### Scenario: anonymous is unauthorized

- **WHEN** a client without a valid session sends any request to
  `/api/admin/llm-provider-models/...`
- **THEN** the response status is `401`
