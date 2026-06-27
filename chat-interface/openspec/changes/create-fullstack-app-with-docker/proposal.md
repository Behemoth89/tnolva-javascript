## Why

Project 1 of the TalTech Agentic Software Development course requires building a ChatGPT-like web application from scratch, but a working fullstack skeleton (Express backend + React frontend + tests + Docker) is the foundation every subsequent capability (chat engine, tools, projects, file upload, backend config UI) will sit on. Scaffolding that skeleton now — with a verified health-check round-trip from React to Express through docker-compose — gives the project a tested, reproducible baseline and a deployment-ready container story from day one.

## What Changes

- Add `backend/` — Node.js 20 + Express 4 + TypeScript service exposing `GET /api/health` with unit and Supertest integration tests (Jest + ts-jest). Configurable port via env, default 3001.
- Add `frontend/` — Vite + React 18 + TypeScript single-page app with a `HealthCheck` component that calls `/api/health`, renders a status badge, uptime, last-checked timestamp, and a manual Refresh button. Tested with Vitest + React Testing Library.
- Add `backend/Dockerfile` (multi-stage `node:20-alpine` builder + slim runtime) and `frontend/Dockerfile` (multi-stage Vite build → `nginx:1.27-alpine` with `/api` reverse-proxy to `backend:3001`).
- Add root `docker-compose.yml` orchestrating `backend` and `frontend` services with a backend healthcheck and `frontend.depends_on: { backend: { condition: service_healthy } }`.
- Add root `README.md` documenting prerequisites, install, dev, test, and Docker workflows.
- Add root `package.json` with convenience scripts (`dev:be`, `dev:fe`, `test`, `build`, `docker:up`, `docker:down`).
- Wire Vite dev-server proxy `/api → http://localhost:3001` so the React app uses a single origin in development and production.

## Capabilities

### New Capabilities

- `backend-health-api`: Contract for the Express `/api/health` endpoint — request/response shape, status codes, CORS policy, and environment configuration.
- `frontend-health-client`: Contract for the React `HealthCheck` component — fetch behavior, rendered states (loading, ok, error), and user interactions.
- `docker-orchestration`: Contract for the `docker-compose.yml` setup — service definitions, port mappings, inter-service networking, and healthcheck gating.
- `testing-standards`: Contract for test coverage and tooling conventions across both subprojects — required test types per capability and how `npm test` must behave.

### Modified Capabilities

None. The repository is greenfield for this change; no existing requirements change.

## Impact

- **New code**: ~25-30 new source files across `backend/`, `frontend/`, and root configuration.
- **New dev tooling**: Node.js 20+, npm, Docker 24+ with Compose v2, optionally WSL2 on Windows.
- **CI/CD**: not introduced in this change; subsequent change will add the deployment pipeline per the course VPS requirement.
- **No existing files modified** other than root `.gitignore` receiving small additions (`frontend/dist/`, `frontend/node_modules/`, `backend/dist/`, `backend/node_modules/`).
- **Ports used in dev**: 3001 (backend), 5173 (frontend Vite), 80 (frontend nginx in Docker). 5173 is mapped to host; 80 is mapped to host as 5173 in compose for parity.
