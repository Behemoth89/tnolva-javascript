# user-admin Specification

## Purpose
Define the admin role and the minimum admin-only API surface needed to verify
the role is wired end-to-end. The first user registered against a fresh
database SHALL automatically receive admin privileges; subsequent users SHALL
not. Admin-only endpoints SHALL be protected on the server in addition to
any UI hiding.

## Requirements
### Requirement: First registered user is automatically admin

The backend SHALL mark the first user registered against an empty database
with `is_admin = 1`. For every subsequent registration, the backend SHALL
insert the new user with `is_admin = 0`.

#### Scenario: first user gets admin

- **WHEN** a client successfully registers against a database with zero users
- **THEN** the response body's `user.is_admin === 1`
- **AND** the row stored in `users` has `is_admin = 1`

#### Scenario: second user is not admin

- **WHEN** the `users` table already has at least one row
- **AND** a client successfully registers a new account
- **THEN** the response body's `user.is_admin === 0`
- **AND** the row stored in `users` has `is_admin = 0`

#### Scenario: bootstrap is race-safe

- **WHEN** two registration requests arrive concurrently against a fresh
  database
- **THEN** at most one of the two resulting users has `is_admin = 1`
- **AND** the other has `is_admin = 0` or the request fails (no two admins
  from a single race)

### Requirement: Admin-only users API

The backend SHALL expose `GET /api/admin/users` returning a JSON array of
registered users. Each element SHALL have shape
`{ "id": <number>, "email": <string>, "is_admin": <number>,
"created_at": <ISO 8601 string> }`. The endpoint SHALL be guarded by
`requireAdmin`.

The response SHALL NOT contain the fields `password` or `password_hash`.

#### Scenario: admin lists all users

- **WHEN** an admin user sends `GET /api/admin/users`
- **THEN** the response status is `200`
- **AND** the response body is an array
- **AND** every element has the fields `id`, `email`, `is_admin`, and
  `created_at`
- **AND** no element has `password` or `password_hash`

#### Scenario: regular user is forbidden

- **WHEN** a non-admin authenticated user sends `GET /api/admin/users`
- **THEN** the response status is `403`

#### Scenario: anonymous user is unauthorized

- **WHEN** a client without a valid session sends `GET /api/admin/users`
- **THEN** the response status is `401`

#### Scenario: users are ordered by creation

- **WHEN** an admin user sends `GET /api/admin/users`
- **THEN** the returned array is ordered by `created_at` ascending
  (oldest first)

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
