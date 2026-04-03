# Phase 1: Foundation & API Client - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffolding is ready and all API calls go through a centralized client with automatic JWT handling. This includes Vite + React + Tailwind CSS setup, React Router SPA mode with placeholder pages, Zustand auth store with persist middleware, and an Axios client with request/response interceptors for JWT token injection and auto-refresh on 401.

</domain>

<decisions>
## Implementation Decisions

### Project structure
- **D-01:** Feature-based organization — src/features/auth/, src/features/todos/, src/features/settings/ — each with its own components, hooks, and types. Scales better as app grows.
- **D-02:** Shared utilities, types, and lib modules live at src/lib/, src/types/, src/utils/ for cross-feature reuse.

### State management
- **D-03:** Zustand with persist middleware for auth store — stores token, refreshToken, user info (firstName, lastName) in localStorage automatically.
- **D-04:** Separate stores — useAuthStore for auth/session state, useAppStore for UI state (sidebar, modals, etc.). Clear separation of concerns.
- **D-05:** Auth store shape: { token, refreshToken, firstName, lastName, isAuthenticated, setAuth, clearAuth }.

### API client design
- **D-06:** Factory function pattern — createApiClient() returns configured Axios instances. More flexible for testing and allows dynamic base URL configuration.
- **D-07:** Queued retry on 401 — when token refresh is in progress, pause all pending requests, refresh token, then replay queued requests. Prevents race conditions when multiple requests hit 401 simultaneously.
- **D-08:** API base URL configured via VITE_API_BASE_URL environment variable in .env file — never hardcoded.
- **D-09:** Request interceptor attaches Bearer token from Zustand store to all outgoing requests.
- **D-10:** Response interceptor catches 401, triggers refresh flow, retries original request with new token.
- **D-11:** Refresh token rotation handled — if API rotates refresh tokens, the new refreshToken is captured and persisted.

### Routing structure
- **D-12:** Pure declarative React Router mode with BrowserRouter — no react-router.config.ts, no framework mode. Uses <BrowserRouter>, <Routes>, <Route> components from 'react-router'. Simpler for a pure SPA consuming an external API.
- **D-13:** Placeholder pages for Phase 1: /login, /register, /dashboard (protected). Settings page added in Phase 4.
- **D-14:** ProtectedRoute component wraps protected routes — reads auth state from Zustand store, redirects to /login if unauthenticated.
- **D-15:** Authenticated users visiting /login or /register are redirected to /dashboard.

### the agent's Discretion
- Exact Tailwind CSS class choices and spacing
- Loading skeleton design for future phases
- Error message copy and styling
- Exact folder structure within each feature directory
- TypeScript interface naming conventions

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication
- `.planning/REQUIREMENTS.md` §Authentication — AUTH-04 (JWT auto-attach), AUTH-05 (auto-refresh on 401) are Phase 1 requirements
- `CLAUDE.md` §Project — API endpoint details, authentication flow (token, refreshToken, Bearer scheme, v1 path parameter)

### Infrastructure
- `.planning/REQUIREMENTS.md` §Infrastructure — INF-01 (Tailwind CSS), INF-02 (React Router) are Phase 1 requirements
- `.planning/ROADMAP.md` §Phase 1 — Phase goal, success criteria, dependency chain

### Stack decisions
- `CLAUDE.md` §Technology Stack — React 19.2, Vite 8, React Router 7.14, Tailwind CSS 4.2, Zustand 5, Axios 1.7, TypeScript 5.7

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing codebase — this is Phase 1, everything is greenfield.

### Established Patterns
- No established patterns yet — this phase sets the patterns that all subsequent phases will follow.

### Integration Points
- Vite dev server + Tailwind CSS — foundational build setup
- React Router — all future pages plug into this routing structure
- Zustand auth store — all authenticated API calls depend on this store
- Axios client — all future API service modules will use this client factory

</code_context>

<specifics>
## Specific Ideas

- "Feature-based structure scales better" — user chose scalability over simplicity
- API base URL should be configurable via environment variable, not hardcoded
- Token refresh should handle concurrent requests safely with queuing
- Protected routes use a wrapper component pattern, not React Router loaders

</specifics>

<deferred>
## Deferred Ideas

- Settings page placeholder — belongs in Phase 4 (Settings & Integration)
- Todo list page — belongs in Phase 3 (Todo Core)
- Docker deployment — belongs in Phase 5 (Docker Deployment)
- Profile editing in settings — explicitly out of scope per PROJECT.md

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-api-client*
*Context gathered: 2026-04-03*
