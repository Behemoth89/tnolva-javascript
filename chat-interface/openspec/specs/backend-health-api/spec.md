# backend-health-api Specification

## Purpose
TBD - created by archiving change create-fullstack-app-with-docker. Update Purpose after archive.
## Requirements
### Requirement: Health endpoint returns service status

The backend SHALL expose `GET /api/health` which returns HTTP `200` with a JSON body containing the service status, process uptime in seconds, and the current server time as an ISO 8601 string.

#### Scenario: Health check returns 200 with expected shape

- **WHEN** a client sends `GET /api/health`
- **THEN** the response status is `200`
- **AND** the response `Content-Type` is `application/json`
- **AND** the body matches `{ "status": "ok", "uptime": <number>, "timestamp": <ISO 8601 string> }`

#### Scenario: Uptime increases between consecutive calls

- **WHEN** a client calls `GET /api/health` twice with at least one second between calls
- **THEN** the second response's `uptime` is greater than the first response's `uptime`

#### Scenario: Timestamp is valid ISO 8601

- **WHEN** a client calls `GET /api/health`
- **THEN** the `timestamp` field parses as a valid date via `new Date(...)` without returning `NaN`

### Requirement: Non-GET methods are rejected

The backend SHALL respond with HTTP `405 Method Not Allowed` for any HTTP method other than `GET` on `/api/health` and SHALL include an `Allow: GET` response header.

#### Scenario: POST to health returns 405

- **WHEN** a client sends `POST /api/health`
- **THEN** the response status is `405`
- **AND** the `Allow` response header includes `GET`

#### Scenario: DELETE to health returns 405

- **WHEN** a client sends `DELETE /api/health`
- **THEN** the response status is `405`
- **AND** the `Allow` response header includes `GET`

### Requirement: CORS allows the development frontend origin

The backend SHALL include CORS headers that allow requests from `http://localhost:5173` (the Vite dev server) and from the production frontend container's exposed origin.

#### Scenario: Preflight from dev origin succeeds

- **WHEN** a client sends an `OPTIONS /api/health` request with `Origin: http://localhost:5173`
- **THEN** the response includes `Access-Control-Allow-Origin` allowing that origin
- **AND** the response includes `Access-Control-Allow-Methods` including `GET`

### Requirement: Server port is configurable via environment

The backend SHALL read its listening port from the `PORT` environment variable. If `PORT` is not set, the server SHALL listen on port `3001`. The server SHALL bind to `0.0.0.0` so it is reachable from other containers.

#### Scenario: Default port is 3001

- **WHEN** the server starts with no `PORT` environment variable set
- **THEN** it accepts connections on port `3001`

#### Scenario: Custom port is honored

- **WHEN** the server starts with `PORT=4000` set in the environment
- **THEN** it accepts connections on port `4000`

