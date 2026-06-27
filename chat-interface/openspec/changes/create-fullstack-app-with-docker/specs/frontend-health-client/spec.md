## ADDED Requirements

### Requirement: HealthCheck component fetches backend health on mount

The `HealthCheck` component SHALL issue a `GET` request to the relative path `/api/health` when it mounts. If a successful response is received, the component SHALL render an "online" indicator with the backend's `uptime` and the last-checked timestamp. If the request fails or returns a non-`ok` status, the component SHALL render an "offline" indicator with an error message.

#### Scenario: Successful fetch renders online state

- **WHEN** the backend returns `200` with `{ "status": "ok", "uptime": 12.3, "timestamp": "<ISO>" }`
- **THEN** the component shows an online badge
- **AND** the component displays the uptime value formatted as a human-readable duration
- **AND** the component displays the last-checked timestamp

#### Scenario: Network failure renders offline state

- **WHEN** the fetch to `/api/health` rejects (network error) or returns a non-200 status
- **THEN** the component shows an offline badge
- **AND** the component displays an error message describing the failure

### Requirement: HealthCheck component exposes a manual Refresh action

The `HealthCheck` component SHALL render a "Refresh" button. Clicking the button SHALL re-issue the `GET /api/health` request and update the displayed state.

#### Scenario: Refresh button triggers a new request

- **WHEN** the user clicks the "Refresh" button
- **THEN** a new request to `/api/health` is issued
- **AND** the displayed status, uptime, and last-checked timestamp are updated with the new response

#### Scenario: Refresh while a request is in flight is disabled

- **WHEN** a request to `/api/health` is in flight
- **THEN** the Refresh button is disabled and cannot be re-clicked until the in-flight request settles

### Requirement: HealthCheck uses the same origin in development and production

The `HealthCheck` component SHALL call `/api/health` using a relative URL (no hard-coded host or port) so that the Vite dev-server proxy (development) and the nginx reverse proxy (Docker) handle routing transparently.

#### Scenario: Relative URL is used

- **WHEN** the component issues its health-check request
- **THEN** the request URL begins with `/api/health` and contains no scheme or host
