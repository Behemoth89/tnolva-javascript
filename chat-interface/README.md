# Chat Interface

A ChatGPT-like web application built for the TalTech Agentic Software Development course. The repository
ships a complete fullstack skeleton — an Express + TypeScript backend, a Vite + React + TypeScript
frontend, automated tests, and a Docker-based dev/prod environment — that subsequent capabilities
(streaming chat, tools, projects, file upload, backend config UI) will be built on top of.

The current health-check skeleton proves the wiring end-to-end: `GET /api/health` is implemented
in `backend/`, proxied by both the Vite dev server and the nginx reverse proxy in Docker, and consumed
by the `HealthCheck` component in `frontend/`.

## Prerequisites

- **Node.js 20+** (tested with 24.x)
- **npm 10+**
- **Docker 24+ with Compose v2** (optional, only required for the Docker workflow)

On Windows, WSL2 is recommended for the Docker workflow; native Windows Docker Desktop also works.

## Project Structure

```
chat-interface/
├── backend/             # Express + TypeScript service (port 3001)
│   ├── src/             # Application source
│   ├── tests/           # Jest unit + Supertest integration tests
│   ├── Dockerfile
│   └── package.json
├── frontend/            # Vite + React 18 + TypeScript app (port 5173)
│   ├── src/             # Application source (components, api, types)
│   ├── tests/           # Vitest component tests
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml   # Orchestrates backend + frontend with health gating
└── package.json         # Root convenience scripts
```

## Quick Start

### Option A: Docker (recommended for parity with production)

```bash
docker compose up -d --build
# Visit http://localhost:5173
docker compose logs -f
docker compose down
```

The backend healthcheck gates the frontend: nginx will not start serving traffic until `/api/health`
returns 200 from the backend container.

### Option B: Native dev (fastest iteration)

Two terminals:

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev
```

```bash
# Terminal 2 — frontend
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:3001`, so the React app uses the same relative URLs in
dev and production.

## Testing

Each subproject has its own test runner:

```bash
# Backend (Jest + Supertest)
cd backend
npm test

# Frontend (Vitest + React Testing Library)
cd frontend
npm run test:run

# Both, sequentially, from the repo root
npm test
```

## Available Scripts

| Command (from repo root) | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run dev:be`         | Start backend with hot reload (`ts-node`)      |
| `npm run dev:fe`         | Start Vite dev server with `/api` proxy        |
| `npm run build:be`       | Compile backend TypeScript to `backend/dist`   |
| `npm run build:fe`       | Build frontend bundle to `frontend/dist`       |
| `npm run build`          | Build both subprojects                         |
| `npm run test:be`        | Run backend tests once                         |
| `npm run test:fe`        | Run frontend tests once                        |
| `npm test`               | Run all tests                                  |
| `npm run docker:up`      | `docker compose up -d`                         |
| `npm run docker:down`    | `docker compose down`                          |
| `npm run docker:logs`    | Tail compose logs                              |
| `npm run docker:build`   | Rebuild compose images                         |

## Troubleshooting

### Port 3001 or 5173 already in use

Find the process holding the port and stop it, or change the published port in `docker-compose.yml`.

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :3001
# Note the PID in the last column, then:
Stop-Process -Id <PID>
```

**macOS / Linux:**
```bash
lsof -i :3001
kill <PID>
```

### Docker build fails with `EACCES` on `node_modules`

Make sure you have a `.dockerignore` in `backend/` and `frontend/` (already provided) that excludes
`node_modules`, `dist`, `coverage`, `.env*`, and `tests`. Never mount the host's `node_modules` into
the container.

### Frontend shows "Offline" badge

The Vite proxy is configured to forward `/api` to `http://localhost:3001`. If you started the frontend
before the backend, the first health-check call will fail. Click **Refresh** once the backend is up.

## Next Steps

This change ships the foundation. Subsequent changes will add:

- A streaming chat engine that proxies to an LLM provider
- Dual-provider support (OpenAI + Anthropic)
- Tool calling, projects, system prompts
- File upload (images, PDFs)
- A backend configuration UI for API keys and model selection
- CI/CD pipeline for the course VPS deployment
