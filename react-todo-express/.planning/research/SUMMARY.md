# Project Research Summary

**Project:** React Todo App with JWT Authentication
**Domain:** Personal Task Management (SPA consuming external TalTech API)
**Researched:** 2026-04-03
**Confidence:** HIGH

## Executive Summary

This is a single-user todo application built as a React SPA that consumes an external TalTech API (taltech.akaver.com). The app delivers core task management — add, complete, edit, delete tasks organized by user-defined categories and priorities — with JWT-based authentication. The 2026 todo app market has converged on a clear lesson: quick capture speed and clean UI matter far more than feature density. AI scheduling, collaboration, and habit tracking are anti-features for this scope. The recommended approach is a feature-based React architecture with Context for auth state, local state for UI, and a centralized Axios client with auto-refresh interceptors.

The stack is well-established: React 19.2, Vite 8, React Router 7 (SPA mode), Tailwind CSS 4, and Docker multi-stage deployment to nginx. All sources are HIGH confidence — official documentation, established patterns, and current best practices. The primary risks are all in the authentication layer: token refresh race conditions, XSS from localStorage, and infinite redirect loops on refresh failure. These are well-documented pitfalls with proven mitigation strategies (singleton refresh pattern, CSP headers, `_retry` flag).

## Key Findings

### Recommended Stack

**Core technologies:**
- **React 19.2.x** — UI library with Actions API, improved Suspense, compiler-driven performance
- **Vite 8.0.x** — Rolldown-powered builds, instant HMR, replaces CRA entirely
- **React Router 7.14.x** — SPA mode (`ssr: false`), `clientLoader`/`clientAction` for data fetching
- **Tailwind CSS 4.2.x** — Zero-runtime, CSS-first config via `@theme`, native Vite plugin
- **TypeScript 5.7.x+** — Catches auth token type errors and API response mismatches
- **Axios 1.7.x** — Request/response interceptors for JWT injection and auto-refresh on 401
- **Zustand 5.0.x** — Lightweight state management with `persist` middleware for token storage
- **Node.js 20.19+** — Vite 8 minimum LTS requirement
- **nginx:stable-alpine** — Production static file server with `try_files` for SPA routing

**Critical version requirements:** Vite 8 requires Node.js 20.19+. React Router 7.x (not v6) for SPA mode and `clientLoader`. Tailwind CSS v4 (not v3) for Vite-native setup without PostCSS.

**Stack decision note:** Zustand was recommended in STACK.md but ARCHITECTURE.md concluded Context + local state is sufficient for this app size. Use Context for auth, useState for everything else.

### Expected Features

**Must have (table stakes):**
- Task CRUD (create, read, update, delete) — core action, users expect this
- Task completion toggle — the fundamental todo action
- Authentication (login/register) with JWT — personal data requires accounts
- Category and priority management — organization is fundamental
- Task filtering by category via sidebar — navigation pattern
- Due dates and priority display — users need to know what's urgent and when
- Protected routes — security baseline for authenticated areas
- Loading states and error handling — users need feedback during async operations
- Docker deployment — deployment requirement for the project

**Should have (competitive):**
- JWT auto-refresh on 401 — seamless session management, no manual re-login
- Sidebar category navigation with task counts — quick visual filtering
- Priority icons (visual) — instant recognition without reading text
- Settings CRUD for categories/priorities — user-defined organization system
- Task sorting via `taskSort` field — user-controlled ordering

**Defer (v2+):**
- Task archiving — API supports it, UI doesn't need it yet
- Task descriptions — adds form complexity, most users don't write them
- Profile editing — distracts from core settings purpose
- Reminders/notifications, recurring tasks, calendar view — different architecture needed
- Search functionality — unnecessary for small task lists

### Architecture Approach

Feature-based project structure with three feature modules (auth, todos, settings) sharing a common services layer. Auth state in React Context, all other state in local component state — no global state library needed. A centralized Axios client with interceptors handles token attachment and auto-refresh transparently, so feature services never manage tokens directly.

**Major components:**
1. **AuthContext + ProtectedRoute** — Central auth state, route guards with loading state to prevent flash
2. **API Client (Axios)** — Singleton instance with request interceptor (Bearer token) and response interceptor (401 → refresh → retry with queue)
3. **Feature Modules** — Auth, Todos, Settings each own their pages, components, hooks, and services with `index.js` public API
4. **MainLayout + Sidebar** — Persistent navigation shell for authenticated pages, category filter passed as props
5. **Service Layer** — `authService`, `todoService`, `settingsService` importing shared `apiClient`

### Critical Pitfalls

1. **JWT Token Refresh Race Condition** — Multiple parallel 401s trigger concurrent refreshes, invalidating tokens. **Avoid:** Singleton refresh pattern with promise deduplication and `_retry` flag on request config.
2. **localStorage XSS Vulnerability** — Tokens accessible to any JS on the page. **Avoid:** CSP headers, dependency audits, short token lifetimes. (Acceptable trade-off for school project with external API.)
3. **Protected Route Flash** — Dashboard content visible before auth check completes. **Avoid:** Three-state auth check (`loading`/`authenticated`/`unauthenticated`) with loading spinner during initialization.
4. **Infinite Redirect Loop on Refresh Failure** — Expired refresh token causes interceptor to loop. **Avoid:** Separate refresh failure handling from access token failure; force logout on refresh endpoint errors.
5. **Over-Engineering State Management** — Redux/RTK for a todo app with 5-6 state pieces. **Avoid:** Context + local state. This app doesn't need a global state library.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & API Client
**Rationale:** Every feature depends on the API client. Must establish project structure, build tooling, and the Axios instance with interceptors before any feature work.
**Delivers:** Vite + React 19 project scaffold, Tailwind CSS 4 setup, shared `apiClient.js` with request/response interceptors, basic UI components (Button, Input, LoadingSpinner), Vite dev proxy for CORS.
**Addresses:** CORS/API version handling (pitfall #6), centralized HTTP client (anti-pattern: hardcoded URLs).
**Uses:** Vite 8, React 19.2, Tailwind CSS 4, Axios 1.7.

### Phase 2: Authentication
**Rationale:** All task endpoints require valid JWT tokens. Auth must be fully functional — including token refresh — before any protected route can work.
**Delivers:** AuthContext with login/logout/register, ProtectedRoute with loading state (no flash), AuthenticatedRoute for login/register pages, singleton token refresh with queue pattern, session restoration on app mount.
**Addresses:** Token refresh race condition (pitfall #1), protected route flash (pitfall #3), infinite redirect loop (pitfall #4), localStorage XSS (pitfall #2).
**Implements:** AuthContext + ProtectedRoute pattern, API Client auto-refresh interceptor.

### Phase 3: Todo Core
**Rationale:** The primary user value. With auth working, task CRUD is the next dependency chain. Categories and priorities must exist before tasks can reference them.
**Delivers:** Category and priority CRUD (services + hooks), TodoList with filtering, TodoForm for create/edit, task completion toggle, priority icons, error states for all operations.
**Addresses:** Missing error states in UI (pitfall #8), useEffect dependency bugs (pitfall #7), over-engineered state (pitfall #5).
**Implements:** Feature module boundary pattern, Sidebar + Content layout.

### Phase 4: Settings & Integration
**Rationale:** Settings wraps the category/priority CRUD already built. Sidebar wiring needs both categories and todos to exist. This is the polish phase.
**Delivers:** Settings page with CategoryManager and PriorityManager panels, sidebar category filter wired to todo list, priority icons on task cards, routing polish (redirects, loading states), empty states.
**Addresses:** Category filter persistence, form data loss on navigation (UX pitfall).
**Implements:** Sidebar + Content layout pattern, feature module cross-communication.

### Phase 5: Docker Deployment
**Rationale:** Orthogonal to user experience. Can be built last without blocking feature development. Requires the app to be fully functional to test deployment.
**Delivers:** Multi-stage Dockerfile (node:20-alpine build → nginx:stable-alpine serve), nginx config with `try_files` for SPA routing, docker-compose for local deployment.
**Addresses:** Docker SPA routing without nginx fallback (pitfall #9).

### Phase Ordering Rationale

- **Auth before todos** because every task endpoint requires authentication — no point building task UI without working auth.
- **API client first** because every service layer depends on it. Interceptors must be correct before any feature makes API calls.
- **Categories/priorities before full todo CRUD** because tasks reference category and priority IDs — they must exist in the system first.
- **Settings after core todos** because settings is a CRUD UI over the same category/priority services already built for todo creation.
- **Docker last** because it's deployment infrastructure, not user-facing functionality. The app must work locally before containerizing.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Authentication):** Token refresh queue implementation needs careful review against TalTech API's specific refresh endpoint behavior (does it rotate refresh tokens?).
- **Phase 5 (Docker Deployment):** nginx proxy configuration for production API calls needs verification based on deployment environment.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented Vite + React + Tailwind setup. Official docs are sufficient.
- **Phase 3 (Todo Core):** Standard CRUD pattern with established React hooks approach.
- **Phase 4 (Settings & Integration):** Reuses patterns from Phase 3 with different endpoints.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations from official documentation (React, Vite, React Router, Tailwind) with current 2026 versions. Version compatibility table verified. |
| Features | HIGH | Based on 2026 market analysis from multiple review sources (Zapier, Toolradar), competitor feature matrix, and project specification. Clear table-stakes vs. differentiator boundaries. |
| Architecture | HIGH | Feature-based structure, Context + local state, Axios interceptor patterns — all from established 2026 best practices with code examples. |
| Pitfalls | HIGH | Each pitfall has concrete reproduction steps, warning signs, and verified mitigation strategies. Sources include multiple 2025-2026 articles on JWT security and React patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- **TalTech API refresh token behavior:** The API spec should be checked to confirm whether refresh tokens rotate (invalidated after each use) or are long-lived. This affects the refresh interceptor implementation.
- **CORS in production:** Development proxy handles localhost, but production Docker deployment needs confirmation — will nginx proxy API requests, or does the TalTech API have CORS headers configured?
- **Token lifetime:** Access token and refresh token expiration durations are not specified. This affects UX expectations (how often users see session expiry).
- **Error response format:** The API's error response shape (field names, status codes) needs verification for proper error message display.

## Sources

### Primary (HIGH confidence)
- `/vitejs/vite` — Vite 8 configuration, Rolldown builds, React plugin setup
- `/remix-run/react-router` — React Router 7 SPA mode, `clientLoader`, protected routes
- `/axios/axios-docs` — Axios interceptors, JWT token refresh pattern
- `/pmndrs/zustand` — Zustand store setup, persist middleware
- https://react.dev/blog/2025/10/01/react-19-2 — React 19.2 release notes
- https://github.com/vitejs/vite/releases/tag/v8.0.0 — Vite 8.0 release
- https://reactrouter.com/7.13.1/how-to/spa — React Router SPA mode guide
- https://tailwindcss.com/docs/installation — Tailwind CSS v4 Vite installation
- OneUptime: "How to Structure Large-Scale React Applications" (Jan 2026)
- DEV Community: "JWT Authentication in React: Secure Routes, Context, and Token Handling" (Dec 2025)
- Zapier: "7 Best To-Do List Apps 2026" — Market analysis, quick capture speed findings

### Secondary (MEDIUM confidence)
- https://dev.to/it-wibbc/guide-to-containerizing-a-modern-javascript-spa — Multi-stage Docker + nginx SPA deployment
- https://jsmanifest.com/jwt-security-best-practices-2026 — JWT security tips
- https://hoop.dev/blog/the-hidden-pitfalls-of-jwt-based-authentication — JWT pitfalls
- Toolradar: "Best Task Management Apps 2026" — Feature comparison
- Project specification: `.planning/PROJECT.md` — Authoritative requirements
- TalTech API OpenAPI spec — Endpoint definitions and field shapes

### Tertiary (LOW confidence)
- Stack Overflow: "Flash of protected route's content with React Router 6" (May 2022) — Older but still relevant pattern

---
*Research completed: 2026-04-03*
*Ready for roadmap: yes*
