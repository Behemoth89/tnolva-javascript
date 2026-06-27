# docker-orchestration Specification

## Purpose
TBD - created by archiving change create-fullstack-app-with-docker. Update Purpose after archive.
## Requirements
### Requirement: docker compose up starts both services

The repository SHALL include a `docker-compose.yml` at the project root that, when started with `docker compose up`, brings up both the `backend` and `frontend` services and reports them as running.

#### Scenario: Both services reach a running state

- **WHEN** a developer runs `docker compose up -d` from the project root
- **THEN** the `backend` service reaches the `running` state within 30 seconds
- **AND** the `frontend` service reaches the `running` state within 60 seconds
- **AND** `docker compose ps` shows both services with status `running` or `healthy`

### Requirement: Backend healthcheck gates the frontend

The `docker-compose.yml` SHALL define a healthcheck on the `backend` service that probes `GET /api/health`. The `frontend` service SHALL declare `depends_on: backend: { condition: service_healthy }` so the frontend does not start until the backend is responding.

#### Scenario: Backend healthcheck passes

- **WHEN** the backend container is running
- **THEN** Docker reports the `backend` service as `healthy` once `GET /api/health` returns `200` from inside the container

#### Scenario: Frontend waits for healthy backend

- **WHEN** `docker compose up` is executed
- **THEN** the `frontend` service is not started until the `backend` service reports `healthy`

### Requirement: Ports are exposed to the host

The `docker-compose.yml` SHALL map host port `3001` to backend container port `3001` and host port `5173` to frontend container port `80` (the nginx listen port).

#### Scenario: Backend is reachable from the host

- **WHEN** `docker compose up` is running
- **THEN** `http://localhost:3001/api/health` on the host machine returns `200` with the health JSON

#### Scenario: Frontend is reachable from the host

- **WHEN** `docker compose up` is running
- **THEN** `http://localhost:5173` on the host machine serves the React application HTML

### Requirement: Frontend can reach the backend by service name

The Docker network defined in `docker-compose.yml` SHALL allow the `frontend` container to call the `backend` container at the hostname `backend` on port `3001`. The `frontend` nginx config SHALL reverse-proxy `/api` requests to `http://backend:3001`.

#### Scenario: Frontend nginx proxies /api to backend container

- **WHEN** the frontend container is running and the backend container is healthy
- **THEN** a `GET http://localhost:5173/api/health` from the host returns the same JSON body as `GET http://localhost:3001/api/health`

