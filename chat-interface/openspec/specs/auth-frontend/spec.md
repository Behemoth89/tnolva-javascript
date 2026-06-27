# auth-frontend Specification

## Purpose
Define the React-side user experience for authentication: an auth context that
hydrates from `/api/auth/me` on load, `Login` and `Register` pages, a route
guard, a logout control, and an admin-only `Admin` page that lists registered
users.

## Requirements
### Requirement: Auth context hydrates from /me on app load

The frontend SHALL provide an `AuthContext` that, when the React app mounts,
issues exactly one `GET /api/auth/me` request to determine the current
session. The context SHALL expose at minimum:

- `user`: the current `{ id, email, is_admin }` object or `null`
- `status`: one of `"loading" | "authenticated" | "unauthenticated"`
- `login(email, password)`: returns a promise resolving on success, rejecting
  with the server's error message on failure
- `register(email, password)`: same contract as `login`
- `logout()`: returns a promise that resolves after the logout request
  completes

All `fetch` calls SHALL use `credentials: "include"` so the session cookie is
sent.

#### Scenario: app loads with a valid session

- **WHEN** the user has a valid session cookie and reloads the page
- **THEN** the context's `status` becomes `"authenticated"`
- **AND** `user` is populated with the values from `/api/auth/me`

#### Scenario: app loads without a session

- **WHEN** the user has no session cookie
- **THEN** the context's `status` becomes `"unauthenticated"`
- **AND** `user` is `null`

#### Scenario: login populates the user

- **WHEN** the user submits valid credentials on the login form
- **THEN** the context's `status` becomes `"authenticated"`
- **AND** `user` reflects the response from `POST /api/auth/login`

#### Scenario: logout clears the user

- **WHEN** the user clicks Logout
- **THEN** `POST /api/auth/logout` is called
- **AND** on resolution the context's `status` becomes `"unauthenticated"`
- **AND** `user` is `null`

### Requirement: Login page

The frontend SHALL render a `/login` route containing a form with `email` and
`password` fields and a submit button. On submit the form SHALL call
`AuthContext.login(email, password)`.

- On success the form SHALL navigate the user to `/`.
- On failure the form SHALL display the server's `error` message inline.
- The form SHALL include a link to `/register`.
- The form SHALL NOT be submitted while a request is in flight (the submit
  button is disabled).

#### Scenario: successful login redirects home

- **WHEN** the user submits valid credentials
- **THEN** the browser navigates to `/`
- **AND** the app renders the authenticated view

#### Scenario: failed login shows an error

- **WHEN** the user submits invalid credentials
- **THEN** the form stays on `/login`
- **AND** an inline error message derived from the server response is visible

#### Scenario: submit is disabled while pending

- **WHEN** a login request is in flight
- **THEN** the submit button has the `disabled` attribute

### Requirement: Register page

The frontend SHALL render a `/register` route containing a form with `email`,
`password`, and `confirm password` fields and a submit button. On submit:

- If `password !== confirm password`, the form SHALL display an inline error
  and SHALL NOT call the API.
- If `password.length < 8`, the form SHALL display an inline error mentioning
  the minimum length and SHALL NOT call the API.
- Otherwise the form SHALL call `AuthContext.register(email, password)`.
- On success the form SHALL navigate to `/`.
- On server failure the form SHALL display the server's `error` message
  inline.
- The form SHALL include a link to `/login`.

#### Scenario: mismatched confirmation blocks submit

- **WHEN** the user enters `password = "abcdefgh"` and `confirm password =
  "abcd1234"`
- **THEN** no network request is sent
- **AND** an inline error indicates the values must match

#### Scenario: short password blocks submit

- **WHEN** the user enters `password = "short"` and `confirm password =
  "short"`
- **THEN** no network request is sent
- **AND** an inline error mentions the minimum length

#### Scenario: successful register redirects home

- **WHEN** the user submits a valid registration
- **THEN** the browser navigates to `/`

#### Scenario: duplicate email shows server error

- **WHEN** the user submits a registration for an email that already exists
- **THEN** an inline error with the server's message is visible
- **AND** the user stays on `/register`

### Requirement: Logout control

The frontend SHALL render a Logout button (in a top nav) that calls
`AuthContext.logout()` and then navigates to `/login`. The button SHALL be
hidden when the auth context's `status` is not `"authenticated"`.

#### Scenario: logout returns to login

- **WHEN** an authenticated user clicks Logout
- **THEN** `POST /api/auth/logout` is called with `credentials: "include"`
- **AND** the browser navigates to `/login`

#### Scenario: logout is hidden when anonymous

- **WHEN** the user is unauthenticated
- **THEN** the Logout button is not rendered

### Requirement: Route guard redirects unauthenticated users

The frontend SHALL wrap protected routes in a `RouteGuard` component. When
the auth context's `status` is `"unauthenticated"`, the guard SHALL redirect
to `/login`. When `status` is `"loading"`, the guard SHALL render a neutral
loading indicator. When `status` is `"authenticated"`, the guard SHALL render
the child route.

The `/` and `/health` (or equivalent) routes are public; `/login` and
`/register` are public. All other routes (including `/admin`) are protected.

#### Scenario: anonymous user redirected from protected route

- **WHEN** an unauthenticated user navigates to `/admin`
- **THEN** the browser URL changes to `/login`

#### Scenario: authenticated user can render a protected route

- **WHEN** an authenticated user navigates to `/admin` and has
  `is_admin === 0`
- **THEN** the route renders the admin-denied view (see "Admin page is
  admin-only" requirement) rather than redirecting

#### Scenario: loading state is shown briefly on startup

- **WHEN** the app first mounts and `status === "loading"`
- **THEN** the protected route shows a loading indicator and does not
  redirect

### Requirement: Admin page is admin-only

The frontend SHALL render a `/admin` route that displays a list of registered
users (id, email, `is_admin`, `created_at`) fetched from `GET /api/admin/users`.
The route SHALL be guarded by `RouteGuard` AND an additional client-side
check: if `user.is_admin !== 1`, the page SHALL render an "Admin privileges
required" message instead of the user list. The frontend SHALL hide the nav
link to `/admin` unless `user.is_admin === 1`.

#### Scenario: admin sees the user list

- **WHEN** an admin user (`is_admin === 1`) navigates to `/admin`
- **THEN** the page displays a list with one row per registered user
- **AND** each row shows `email`, `is_admin` (as "admin" or "user"), and
  `created_at`

#### Scenario: non-admin sees denial

- **WHEN** a non-admin user (`is_admin === 0`) navigates to `/admin`
- **THEN** the page displays an "Admin privileges required" message
- **AND** the user list is NOT rendered
- **AND** no call to `GET /api/admin/users` is required (frontend blocks it
  before the request)

#### Scenario: admin nav link hidden for non-admins

- **WHEN** the user is authenticated with `is_admin === 0`
- **THEN** no link to `/admin` is rendered in the navigation
