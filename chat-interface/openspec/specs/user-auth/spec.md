# user-auth Specification

## Purpose
Define the persistent user identity, password-based authentication API, and
authorization middleware for the chat-interface backend. The system SHALL
provide a SQLite-backed `users` table, four HTTP endpoints under `/api/auth`,
and two Express middleware functions (`requireAuth`, `requireAdmin`) that gate
subsequent capabilities.

## Requirements
### Requirement: users table schema

The backend SHALL persist users in a SQLite database using a `users` table
with the following columns:

- `id` — `INTEGER PRIMARY KEY AUTOINCREMENT`
- `email` — `TEXT UNIQUE NOT NULL`
- `password_hash` — `TEXT NOT NULL`
- `is_admin` — `INTEGER NOT NULL DEFAULT 0` (interpreted as a boolean:
  `0` = regular user, `1` = admin)
- `created_at` — `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

The `email` column SHALL be unique. Email comparison SHALL be
case-insensitive (the column is stored normalized to lowercase and uniqueness
is enforced against the lowercased value).

#### Scenario: schema is created on first startup

- **WHEN** the backend process starts against a fresh SQLite file
- **THEN** the `users` table exists with the columns and constraints above

#### Scenario: schema creation is idempotent

- **WHEN** the backend process starts against a SQLite file that already has
  the `users` table
- **THEN** startup does not fail and the existing table is preserved

### Requirement: Passwords are never stored in plaintext

The backend SHALL hash every user password with `bcrypt` at a cost factor of
`10` or greater before writing it to `password_hash`. Plaintext passwords
SHALL NOT be persisted, logged, or returned in any HTTP response body.

#### Scenario: registered password is stored as a bcrypt hash

- **WHEN** a user successfully registers with password `P`
- **THEN** the row in `users` has `password_hash` that is a bcrypt hash
- **AND** `password_hash` does not contain the string `P`

#### Scenario: API responses never contain password material

- **WHEN** any auth endpoint returns a successful response body containing
  user data
- **THEN** the body SHALL NOT contain the field `password` or `password_hash`

### Requirement: Register endpoint validates and persists a new user

The backend SHALL expose `POST /api/auth/register` accepting a JSON body of
`{ "email": string, "password": string }`. The endpoint SHALL validate the
input, hash the password, insert the user, and start a session. Validation
rules:

- `email` MUST match a basic RFC-5322-style email shape AND be ≤ 254
  characters; it is normalized to lowercase before storage.
- `password` MUST be at least 8 characters and at most 128 characters.

On success the endpoint SHALL return HTTP `201` with a JSON body
`{ "user": { "id": <number>, "email": <string>, "is_admin": <number> } }`
and SHALL set the session cookie described in the "Session cookie
characteristics" requirement.

#### Scenario: successful registration

- **WHEN** a client posts `{ "email": "alice@example.com", "password":
  "correcthorse" }` to `/api/auth/register`
- **THEN** the response status is `201`
- **AND** the response body has `user.email === "alice@example.com"`
- **AND** the response body has `user.id` as a positive integer
- **AND** the response body has `user.is_admin` equal to `1` if this is the
  first user, otherwise `0`
- **AND** the response sets the session cookie

#### Scenario: registration rejects malformed email

- **WHEN** a client posts `{ "email": "not-an-email", "password":
  "correcthorse" }`
- **THEN** the response status is `400`
- **AND** the response body contains an `error` field describing the
  validation failure
- **AND** no user is inserted

#### Scenario: registration rejects weak password

- **WHEN** a client posts `{ "email": "bob@example.com", "password": "short"
  }`
- **THEN** the response status is `400`
- **AND** the response body contains an `error` field mentioning password
  requirements
- **AND** no user is inserted

#### Scenario: registration rejects duplicate email

- **WHEN** a user with `email === "alice@example.com"` already exists
- **AND** a client posts `{ "email": "alice@example.com", "password":
  "anotherpassword" }` to `/api/auth/register`
- **THEN** the response status is `409`
- **AND** the response body contains an `error` field indicating the email is
  taken
- **AND** no second user is inserted

#### Scenario: registration is case-insensitive on email uniqueness

- **WHEN** a user with `email === "alice@example.com"` already exists
- **AND** a client posts `{ "email": "ALICE@example.com", "password":
  "anotherpassword" }`
- **THEN** the response status is `409`

### Requirement: Login endpoint authenticates a user

The backend SHALL expose `POST /api/auth/login` accepting a JSON body of
`{ "email": string, "password": string }`. On success the endpoint SHALL
verify the bcrypt hash, start a session, and return HTTP `200` with body
`{ "user": { "id": <number>, "email": <string>, "is_admin": <number> } }`
and set the session cookie.

On any failure (unknown email, wrong password, validation error) the
endpoint SHALL return HTTP `401` with a generic error body
`{ "error": "Invalid email or password" }`. The response SHALL NOT disclose
which field was wrong.

#### Scenario: successful login sets session

- **WHEN** a client posts valid credentials for an existing user
- **THEN** the response status is `200`
- **AND** the response body has `user.email` matching the input (lowercased)
- **AND** the response sets the session cookie

#### Scenario: login fails for wrong password

- **WHEN** a client posts the correct email and an incorrect password
- **THEN** the response status is `401`
- **AND** the response body's `error` field is the generic invalid-credentials
  message

#### Scenario: login fails for unknown email

- **WHEN** a client posts an email that does not exist in the `users` table
- **THEN** the response status is `401`
- **AND** the response body's `error` field is identical to the wrong-password
  message (no enumeration)

#### Scenario: login response never contains password material

- **WHEN** any login response (success or failure) is returned
- **THEN** the body SHALL NOT contain the fields `password` or `password_hash`

### Requirement: Logout endpoint destroys the session

The backend SHALL expose `POST /api/auth/logout`. The endpoint SHALL destroy
the current session and clear the session cookie. It SHALL return HTTP
`204 No Content`.

#### Scenario: logout clears the session

- **WHEN** an authenticated client posts to `/api/auth/logout`
- **THEN** the response status is `204`
- **AND** the response sets a session cookie with an empty value and an
  immediate `Expires` in the past
- **AND** a subsequent `GET /api/auth/me` with the cleared cookie returns
  `401`

#### Scenario: logout is idempotent for anonymous clients

- **WHEN** an unauthenticated client posts to `/api/auth/logout`
- **THEN** the response status is `204`
- **AND** no error is raised

### Requirement: Me endpoint returns the current user

The backend SHALL expose `GET /api/auth/me`. When the request carries a
valid session, the endpoint SHALL return HTTP `200` with body
`{ "user": { "id": <number>, "email": <string>, "is_admin": <number> } }`.
When the request is unauthenticated, the endpoint SHALL return HTTP `401`
with body `{ "error": "Not authenticated" }`.

#### Scenario: authenticated me returns user data

- **WHEN** an authenticated client sends `GET /api/auth/me`
- **THEN** the response status is `200`
- **AND** the response body has a `user` object with `id`, `email`, and
  `is_admin` fields
- **AND** the body does not contain `password` or `password_hash`

#### Scenario: unauthenticated me returns 401

- **WHEN** a client without a valid session sends `GET /api/auth/me`
- **THEN** the response status is `401`

### Requirement: Session cookie characteristics

The session cookie set by login, register, and me SHALL be:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` when `NODE_ENV === "production"`, otherwise `false`
- `path: "/"`
- Signed with a server-side secret loaded from `SESSION_SECRET`

The session payload SHALL include at minimum `userId` (number).

#### Scenario: cookie is httpOnly

- **WHEN** a successful login or register response is returned
- **THEN** the `Set-Cookie` header is not readable from JavaScript
  (`httpOnly` flag set)

#### Scenario: cookie is secure in production

- **WHEN** the backend runs with `NODE_ENV=production`
- **THEN** the `Set-Cookie` header has the `Secure` flag

#### Scenario: cookie is not secure in development

- **WHEN** the backend runs with `NODE_ENV` not equal to `production`
- **THEN** the `Set-Cookie` header does not have the `Secure` flag (so HTTP
  dev works)

### Requirement: requireAuth middleware blocks anonymous requests

The backend SHALL export a `requireAuth` middleware that, when attached to
a route, rejects any request lacking a valid session with HTTP `401` and
body `{ "error": "Not authenticated" }`. On success it SHALL attach the
authenticated user's id and `is_admin` flag to `req.auth` and call `next()`.

#### Scenario: anonymous request is rejected

- **WHEN** a request without a valid session reaches a `requireAuth`-guarded
  route
- **THEN** the response status is `401`
- **AND** the downstream handler is not invoked

#### Scenario: authenticated request passes through

- **WHEN** a request with a valid session reaches a `requireAuth`-guarded
  route
- **THEN** the downstream handler is invoked
- **AND** `req.auth.userId` equals the session's `userId`
- **AND** `req.auth.isAdmin` equals the user's `is_admin` flag

### Requirement: requireAdmin middleware blocks non-admin requests

The backend SHALL export a `requireAdmin` middleware that calls `requireAuth`
first and then rejects any request whose session user does not have
`is_admin === 1` with HTTP `403` and body
`{ "error": "Admin privileges required" }`.

#### Scenario: regular user is rejected

- **WHEN** a request whose session user has `is_admin === 0` reaches a
  `requireAdmin`-guarded route
- **THEN** the response status is `403`

#### Scenario: admin user passes through

- **WHEN** a request whose session user has `is_admin === 1` reaches a
  `requireAdmin`-guarded route
- **THEN** the downstream handler is invoked

#### Scenario: anonymous request is rejected with 401

- **WHEN** a request without a valid session reaches a `requireAdmin`-guarded
  route
- **THEN** the response status is `401` (not `403`)

### Requirement: Rate limiting on auth endpoints

The backend SHALL apply an IP-based rate limiter to `POST /api/auth/register`
and `POST /api/auth/login`. The default limit SHALL be 10 requests per 15
minutes per IP. Over-limit requests SHALL receive HTTP `429` with a
`Retry-After` header.

#### Scenario: too many login attempts

- **WHEN** a single IP submits 11 login attempts within 15 minutes
- **THEN** the 11th response status is `429`
- **AND** the response includes a `Retry-After` header
