## 1. Backend scaffold

- [ ] 1.1 Create `backend/` directory with `package.json` (name: `chat-interface-backend`, type: `module: false`, scripts: `dev`, `build`, `start`, `test`)
- [ ] 1.2 Add backend runtime deps: `express`, `cors`, `helmet`, `dotenv`, `morgan`
- [ ] 1.3 Add backend devDeps: `typescript`, `ts-node`, `@types/node`, `@types/express`, `@types/cors`, `@types/morgan`, `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`
- [ ] 1.4 Add `backend/tsconfig.json` (strict, `target: ES2022`, `module: commonjs`, `outDir: dist`, `rootDir: src`, `esModuleInterop: true`, `resolveJsonModule: true`)
- [ ] 1.5 Add `backend/jest.config.ts` (preset `ts-jest`, `testEnvironment: node`, `testMatch: ['**/tests/**/*.test.ts']`)
- [ ] 1.6 Add `backend/.env.example` documenting `PORT=3001`
- [ ] 1.7 Add `backend/.dockerignore` excluding `node_modules`, `dist`, `coverage`, `.env*`, `tests`

## 2. Backend implementation

- [ ] 2.1 Create `backend/src/config.ts` exporting `{ port: number }` read from `process.env.PORT` with default `3001`
- [ ] 2.2 Create `backend/src/routes/health.ts` exporting an Express `Router` with `GET /` returning `{ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() }` and a 405 handler for other methods with `Allow: GET` header
- [ ] 2.3 Create `backend/src/app.ts` exporting a factory `createApp()` that wires `helmet`, `cors` (origin: `http://localhost:5173`), `express.json()`, `morgan('dev')` in dev, mounts `/api/health` from the health router, and returns the app
- [ ] 2.4 Create `backend/src/index.ts` that calls `createApp().listen(config.port, '0.0.0.0', () => console.log(...))`
- [ ] 2.5 Verify `npm run build` produces `backend/dist/` and `npm run dev` starts the server on port 3001

## 3. Backend tests

- [ ] 3.1 Create `backend/tests/unit/health.test.ts` that imports the health router and asserts the response object shape (status, uptime, timestamp) using a mock `req`/`res`
- [ ] 3.2 Create `backend/tests/integration/health.api.test.ts` using Supertest against `createApp()` that asserts `GET /api/health` returns 200 with the expected JSON body and that `POST /api/health` returns 405 with `Allow: GET` header
- [ ] 3.3 Run `npm test` in `backend/` and confirm exit code `0` with both tests passing

## 4. Frontend scaffold

- [ ] 4.1 Create `frontend/` directory with `package.json` (name: `chat-interface-frontend`, type: `module`, scripts: `dev`, `build`, `preview`, `test`, `test:run`)
- [ ] 4.2 Add frontend deps: `react`, `react-dom`
- [ ] 4.3 Add frontend devDeps: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- [ ] 4.4 Add `frontend/tsconfig.json` (strict, `target: ES2022`, `jsx: react-jsx`, `module: ESNext`, `moduleResolution: bundler`, `lib: ["ES2022", "DOM", "DOM.Iterable"]`)
- [ ] 4.5 Add `frontend/tsconfig.node.json` for Vite config typing
- [ ] 4.6 Add `frontend/vite.config.ts` with the React plugin, a `server.proxy['/api'] → http://localhost:3001` entry, and a Vitest config block (`test.environment: 'jsdom'`)
- [ ] 4.7 Add `frontend/index.html` with a single `#root` div and a script tag for `src/main.tsx`
- [ ] 4.8 Add `frontend/.dockerignore` excluding `node_modules`, `dist`, `coverage`, `.env*`, `tests`
- [ ] 4.9 Add `frontend/src/main.tsx` mounting `<App />` into `#root` with React 18's `createRoot`
- [ ] 4.10 Add `frontend/src/vite-env.d.ts` referencing `vite/client`

## 5. Frontend implementation

- [ ] 5.1 Create `frontend/src/types/health.ts` exporting the `HealthResponse` interface (`status`, `uptime`, `timestamp`)
- [ ] 5.2 Create `frontend/src/api/health.ts` exporting `fetchHealth(): Promise<HealthResponse>` that calls `/api/health` and throws on non-2xx responses
- [ ] 5.3 Create `frontend/src/components/HealthCheck.tsx` with state for `status` (`'idle' | 'loading' | 'ok' | 'error'`), `uptime`, `timestamp`, `error`, and a `load()` callback; renders a badge (online=green / offline=red), uptime formatted as `Xh Ym Zs`, last-checked timestamp, and a Refresh button disabled while loading
- [ ] 5.4 Create `frontend/src/App.tsx` rendering `<HealthCheck />` as the page content
- [ ] 5.5 Verify `npm run build` produces `frontend/dist/` and `npm run dev` serves the app with the Vite proxy live

## 6. Frontend tests

- [ ] 6.1 Create `frontend/tests/HealthCheck.test.tsx` that uses `vi.spyOn(global, 'fetch')` (or msw) to return a stubbed `/api/health` response, renders the component, and asserts the online indicator and uptime text appear
- [ ] 6.2 Add a second test case asserting the offline state renders when fetch rejects
- [ ] 6.3 Add `frontend/src/test-setup.ts` importing `@testing-library/jest-dom` and reference it from `vite.config.ts` (`test.setupFiles`)
- [ ] 6.4 Run `npm test` (or `npm run test:run`) in `frontend/` and confirm exit code `0` with all tests passing

## 7. Docker files

- [ ] 7.1 Create `backend/Dockerfile` (multi-stage: `node:20-alpine` builder running `npm ci && npm run build`, runtime stage copying `dist/` + `node_modules` + `package.json`, `EXPOSE 3001`, `HEALTHCHECK CMD wget --spider -q http://localhost:3001/api/health || exit 1`, `CMD ["node", "dist/index.js"]`)
- [ ] 7.2 Create `frontend/nginx.conf` with a `server { listen 80; }` block, `location /api/ { proxy_pass http://backend:3001/api/; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }`, and `location / { try_files $uri /index.html; }` for SPA fallback
- [ ] 7.3 Create `frontend/Dockerfile` (multi-stage: `node:20-alpine` builder running `npm ci && npm run build`, runtime stage copying `dist/` to `nginx:1.27-alpine` and copying `nginx.conf` to `/etc/nginx/conf.d/default.conf`, `EXPOSE 80`)

## 8. Docker Compose

- [ ] 8.1 Create root `docker-compose.yml` with version pinning, two services (`backend`, `frontend`), a default network, and the `backend` service using `build: ./backend`, `ports: ["3001:3001"]`, `environment: { PORT: 3001 }`, the Dockerfile healthcheck
- [ ] 8.2 Add the `frontend` service to compose using `build: ./frontend`, `ports: ["5173:80"]`, and `depends_on: { backend: { condition: service_healthy } }`
- [ ] 8.3 Add a named volume or anonymous volume for backend `node_modules` if needed for fast dev iteration (skip for now; can revisit)
- [ ] 8.4 Verify `docker compose config` parses without errors (lint step; no need to actually build yet if Docker isn't available locally)

## 9. Root project files

- [ ] 9.1 Create root `package.json` with name `chat-interface`, private: true, and convenience scripts: `dev:be` (`cd backend && npm run dev`), `dev:fe` (`cd frontend && npm run dev`), `test:be` (`cd backend && npm test`), `test:fe` (`cd frontend && npm run test:run`), `test` (runs both sequentially), `build:be`, `build:fe`, `build` (both), `docker:up` (`docker compose up -d`), `docker:down` (`docker compose down`), `docker:logs` (`docker compose logs -f`)
- [ ] 9.2 Create root `README.md` with sections: Overview, Prerequisites (Node 20+, Docker 24+), Project Structure, Quick Start (Docker path + native dev path), Testing, Available Scripts, Troubleshooting (port conflicts), Next Steps
- [ ] 9.3 Add small extensions to root `.gitignore` for `backend/dist`, `frontend/dist`, `frontend/coverage`, `backend/coverage`, `*.tsbuildinfo`

## 10. Validation

- [ ] 10.1 Run `openspec validate create-fullstack-app-with-docker --strict` and resolve any reported issues
- [ ] 10.2 Run `openspec status --change create-fullstack-app-with-docker` to confirm all 4 artifacts are in `done` state
- [ ] 10.3 Commit the change with a meaningful message: `chore: scaffold express+react fullstack skeleton with docker`
