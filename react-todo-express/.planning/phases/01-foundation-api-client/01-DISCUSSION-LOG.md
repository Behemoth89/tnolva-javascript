# Phase 1: Foundation & API Client - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 01-foundation-api-client
**Areas discussed:** Project structure, State management, API client design, Routing structure

---

## Project structure

| Option | Description | Selected |
|--------|-------------|----------|
| Feature-based | Group by feature: src/features/auth/, src/features/todos/, src/features/settings/ — each with its own components, hooks. Scales better as app grows. | ✓ |
| Type-based | Group by type: src/components/, src/pages/, src/services/, src/store/ — simpler for small apps, but requires jumping between folders. | |

**User's choice:** Feature-based (Recommended)
**Notes:** User chose scalability over simplicity — feature-based structure scales better as app grows.

---

## State management

| Option | Description | Selected |
|--------|-------------|----------|
| Zustand with persist | Single useAuthStore with persist middleware — stores token, refreshToken, user info in localStorage. Clean, minimal boilerplate. | ✓ |
| Zustand without persist | Same store but manual localStorage handling — more control but more code to maintain. | |

**User's choice:** Zustand with persist (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Separate stores | useAuthStore for tokens/session, useAppStore for UI state (sidebar, modals, etc.). Clear separation of concerns. | ✓ |
| Single store | One useStore with auth and UI slices together. Simpler but less modular. | |

**User's choice:** Separate stores (Recommended)

---

## API client design

| Option | Description | Selected |
|--------|-------------|----------|
| Queued retry | On 401, pause all pending requests, refresh token, replay queued requests. Prevents race conditions when multiple requests hit 401 simultaneously. | ✓ |
| Simple retry | On 401, refresh token and retry the failed request. Simpler but may have race conditions if multiple requests fail at once. | |

**User's choice:** Queued retry (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Singleton client | One Axios instance created once, exported from src/lib/api.ts. All API calls import this instance. Interceptors configured at creation. | |
| Factory function | createApiClient() returns new instances. More flexible for testing but adds complexity for a school project. | ✓ |

**User's choice:** Factory function
**Notes:** User preferred factory function pattern for testing flexibility.

| Option | Description | Selected |
|--------|-------------|----------|
| Env variable | VITE_API_BASE_URL in .env file — configurable for dev/prod, never hardcoded. | ✓ |
| Hardcoded constant | Direct string 'https://taltech.akaver.com/api/v1' — simpler but less flexible. | |

**User's choice:** Env variable (Recommended)

---

## Routing structure

| Option | Description | Selected |
|--------|-------------|----------|
| Login + Dashboard | /login, /register, /dashboard (protected placeholder). Clean, minimal — other pages added in later phases. | ✓ |
| Login + Dashboard + Settings | /login, /register, /dashboard, /settings. Settings placeholder added now since it's in scope for Phase 4. | |

**User's choice:** Login + Dashboard (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Route wrapper | A <ProtectedRoute> component that reads auth state from Zustand store, redirects to /login if unauthenticated. Wraps protected routes. | ✓ |
| Loader-based | React Router clientLoader checks auth before rendering. More integrated with React Router 7 patterns but slightly more complex. | |

**User's choice:** Route wrapper (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| SPA mode | ssr: false in react-router.config.ts with BrowserRouter. Pure client-side rendering — matches the SPA consuming external API pattern. | ✓ |
| Framework mode | ssr: true with SSR capabilities. Overkill for this project since there's no server to render. | |

**User's choice:** SPA mode (Recommended)

---

## the agent's Discretion

- Exact Tailwind CSS class choices and spacing
- Loading skeleton design for future phases
- Error message copy and styling
- Exact folder structure within each feature directory
- TypeScript interface naming conventions

## Deferred Ideas

- Settings page placeholder — belongs in Phase 4
- Todo list page — belongs in Phase 3
- Docker deployment — belongs in Phase 5
- Profile editing in settings — explicitly out of scope per PROJECT.md
