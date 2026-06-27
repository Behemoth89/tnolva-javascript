## Context

Project 1 of the TalTech Agentic Software Development course requires a fullstack web application built from scratch. Subsequent assignments will add a streaming chat engine, dual-provider LLM support, tool calling, projects/system prompts, file upload, and a backend configuration UI. None of that work can start without a tested, reproducible fullstack skeleton: an Express backend, a React frontend, automated tests, and a Docker-based dev/prod environment.

The current repository is greenfield (only `.gitignore`, `.opencode/`, and `openspec/` exist). The change introduces the entire skeleton and a verified health-check round-trip from React to Express that proves the wiring works end-to-end.

## Goals / Non-Goals

**Goals:**
- Provide a working Express + TypeScript backend with one public endpoint (`/api/health`) and a complete test suite (unit + integration).
- Provide a working Vite + React + TypeScript frontend that consumes that endpoint via a `HealthCheck` component with at least one component test.
- Provide a `docker-compose.yml` that brings both services up reproducibly, with a backend healthcheck gating the frontend.
- Establish conventions (app-factory pattern, relative API URLs, env-driven port) that subsequent capabilities can build on.

**Non-Goals:**
- Implementing the chat engine, tools, projects, file upload, or backend config UI — those are future changes.
- CI/CD pipeline configuration — that is a separate change tied to the course VPS deployment.
- Authentication, persistence, websockets, or streaming — not required for the health-check skeleton.
- Coverage thresholds / coverage gates — tests are required to exist and pass, not to meet a coverage target.

## Decisions

### Decision: Monorepo with two independent npm subprojects, no workspaces

- **Why**: Keeps each subproject's `package.json`, lockfile, and Docker build context fully independent. Avoids hoisting-related tooling pain and makes the Docker images simpler (each builds from its own folder).
- **Alternatives considered**:
  - npm workspaces — would deduplicate deps, but complicates Docker builds and is not needed for two subprojects.
  - pnpm/turborepo monorepo — overkill at this scale and adds a tool dependency the course does not require.

### Decision: TypeScript with strict mode in both subprojects

- **Why**: The course explicitly permits "framework and language choice is free" and the long-lived nature of the project (defense in 2026, multiple subsequent assignments) benefits from compile-time safety.
- **Alternatives considered**:
  - Plain JavaScript — faster to scaffold but loses type safety for the chat API contracts that come next.

### Decision: App-factory pattern (`app.ts` returns Express instance, `index.ts` calls `listen()`)

- **Why**: Supertest can mount the Express app directly without binding a port, making integration tests fast and deterministic. This pattern is the standard Express+TS testing idiom.
- **Alternatives considered**:
  - Single `server.ts` that both listens and exports — would require tests to either bind a port or refactor anyway.

### Decision: Vite dev proxy for `/api` in development, nginx reverse proxy in production

- **Why**: The React app uses a relative URL (`/api/health`) in both modes. In dev, Vite's built-in proxy forwards `/api` to `http://localhost:3001`. In Docker, nginx on the frontend container forwards `/api` to `http://backend:3001` over the compose network. This means the frontend code never needs to know the backend's host or port.
- **Alternatives considered**:
  - Hard-coded backend URL with `VITE_API_URL` env var — would require different code paths or rebuilds for dev vs prod.
  - CORS-only approach with direct cross-origin calls — works, but introduces a second origin and complicates cookie/session handling later.

### Decision: Multi-stage Dockerfiles for both services

- **Why**: `backend/Dockerfile` uses a `node:20-alpine` builder to compile TypeScript, then copies the `dist/` output to a slim runtime image. `frontend/Dockerfile` uses a Vite build stage and copies the static bundle into `nginx:1.27-alpine`. Both images stay small (under ~150 MB) and ship only production artifacts.
- **Alternatives considered**:
  - Single combined image serving both — rejected: harder to scale and debug; complicates the healthcheck story.

### Decision: Backend healthcheck uses `wget --spider` on `/api/health`

- **Why**: `wget` is preinstalled on `node:20-alpine`; `--spider` performs a HEAD-like request that does not log a full body, keeping healthcheck noise down. The compose `depends_on.condition: service_healthy` gate then ensures the frontend container only starts once the backend can serve traffic.
- **Alternatives considered**:
  - Custom Node.js healthcheck script — extra image layer, more code to maintain.
  - `curl` — not preinstalled on alpine by default.

### Decision: Frontend host port is `5173` in Docker to match Vite's dev port

- **Why**: Developers switching between `npm run dev` and `docker compose up` see the same URL in their browser, reducing cognitive load. The container still listens on nginx's default `80`; the compose file maps host `5173 → container 80`.

## Risks / Trade-offs

- **[Risk]** Docker build context for the backend inadvertently includes `node_modules` from the host, producing a bloated image or a `EACCES` error on Linux. → **Mitigation**: Use a `.dockerignore` in `backend/` that excludes `node_modules`, `dist`, `coverage`, `.env*`. Same for `frontend/`.
- **[Risk]** CORS misconfiguration in dev silently allows the React app to fall back to no-cors and report false-positive "online" results. → **Mitigation**: The `cors` middleware is added explicitly in `app.ts` and a dedicated test asserts the CORS headers (covered by `backend-health-api` spec).
- **[Risk]** Port `3001` or `5173` already in use on developer machine causes `docker compose up` to fail. → **Mitigation**: Document the conflict in `README.md` and provide the command to free the port (`netstat -ano | findstr :3001` on Windows).
- **[Risk]** `ts-jest` is slower than `swc`/`esbuild`-based transforms. → **Mitigation**: Acceptable at this scale (single test file). Revisit if test count grows significantly.
- **[Trade-off]** Two independent `package.json` files means developers must `cd` into each subproject to run tests, rather than `npm test` at the root. → **Mitigation**: Root `package.json` exposes convenience scripts (`dev:be`, `dev:fe`, `test`, `docker:up`) that wrap the subproject commands.

## Migration Plan

This change introduces new files only; no existing application code exists to migrate. The "migration" is simply the initial commit of the skeleton.

Rollback: removing the change's commits restores the repo to its greenfield state. No data, no persistent state, no external systems are touched.

## Open Questions

- Should root `package.json` use npm scripts as a thin wrapper, or should we adopt npm workspaces later? **Current stance**: thin wrapper, revisit when the second capability is added.
- Do we want a `Makefile` in addition to npm scripts for the convenience targets (`up`, `down`, `logs`)? **Current stance**: skip — npm scripts cover it; Makefile adds platform-specific friction on Windows.
- Should `nginx.conf` live in the frontend repo or in a separate `infra/` folder? **Current stance**: keep it inside `frontend/` next to the `Dockerfile` to keep the frontend self-contained.
