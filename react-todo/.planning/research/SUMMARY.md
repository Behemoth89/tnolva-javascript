# Project Research Summary

**Project:** React Todo App with JWT Authentication
**Domain:** Personal Task Management (SPA consuming external TalTech API)
**Researched:** 2026-04-03
**Confidence:** HIGH

## Executive Summary

This is a single-user React SPA that manages tasks through the TalTech API (taltech.akaver.com). It is a school project where the goal is demonstrating competency in modern React development — not building a commercial todo product. The recommended approach is a feature-based architecture with React 19.2, Vite 8, React Router 7 (SPA mode), Tailwind CSS 4, and Axios with JWT auto-refresh interceptors. Zustand was recommended by stack research but architecture research concluded Context + local state is sufficient for this app's scale — avoid over-engineering state management.

The key risk is JWT token handling: refresh race conditions, infinite redirect loops, and XSS exposure from localStorage are the most common failure modes. All three are preventable with a singleton refresh pattern, a `_retry` flag on interceptors, and Content Security Policy headers. The second risk is scope creep — the feature landscape is clear on what to defer (task descriptions, archiving, collaboration, AI scheduling). Stay focused on CRUD + auth + settings.

Docker deployment with nginx multi-stage builds is straightforward and orthogonal to user-facing features — it belongs in the final phase. The external API means CORS handling via Vite dev proxy and correct `/v1/` URL prefixing must be established before any component makes API calls.

## Key Findings

### Recommended Stack

**Core technologies:**
- **React 19.2.x** — UI library — Current stable with Actions API, improved Suspense, compiler-driven performance
- **Vite 8.0.x** — Build tool — Rolldown-powered builds, instant HMR, native ES modules
- **React Router 7.14.x** — Client-side routing — SPA mode via `ssr: false`, `clientLoader`/`clientAction` for data fetching
- **Tailwind CSS 4.2.x** — Utility-first CSS — Zero-runtime, Vite-native via `@tailwindcss/vite`, CSS-first configuration
- **Axios 1.7.x** — HTTP client — Required for request/response interceptors to handle JWT token injection and auto-refresh on 401
- **TypeScript 5.7.x+** — Type safety — Catches auth token type errors, API response shape mismatches

**Critical version requirements:**
- Node.js 20.19+ minimum (Vite 8 requirement)
- React Router 7.x required (v6 is maintenance mode, lacks SPA mode)
- Tailwind CSS 4.x required (v3 needs PostCSS + tailwind.config.js, v4 eliminates both)

**Stack decision note:** Zustand was recommended in STACK.md but ARCHITECTURE.md concluded Context + local state is sufficient for this app size. Use Context for auth, useState for everything else.

### Expected Features

**Must have (table stakes):**
- Task CRUD (add, complete, edit, delete) — core action, without it there's no app
- Authentication (login/register/logout) — personal data requires accounts
- JWT auto-refresh on 401 — seamless session management
- Protected routes — security baseline for authenticated areas
- Task filtering by category via sidebar — navigation pattern
- Priority display with icons — visual differentiation
- Settings CRUD for categories and priorities — user-defined organization
- Docker deployment — deployment requirement
- Loading states, error handling, empty states — user feedback during async ops

**Should have (competitive):**
- Sidebar category navigation with task counts — quick visual filtering
- Task sorting (taskSort field) — user-controlled ordering
- Category tags — additional metadata

**Defer (v2+):**
- Task archiving — API supports it, UI doesn't yet (add if users request "soft delete")
- Task descriptions — adds form complexity, most users don't write them
- Profile editing — distracts from core settings purpose
- Recurring tasks, calendar view, search — complex features for small task lists

### Architecture Approach

Feature-based project structure with three feature modules (auth, todos, settings), shared UI components, and a centralized Axios client with interceptors. No global state library — Context for auth, local state for everything else. Pages live inside their feature folders, not in a separate `pages/` directory. Each feature exports a public API through `index.js` to enforce module boundaries.

**Major components:**
1. **AuthContext + ProtectedRoute** — Central auth state, route guards with three-state check (loading/authenticated/unauthenticated)
2. **ApiClient (Axios)** — HTTP client with request interceptor (Bearer token) and response interceptor (401 → refresh → retry with queue)
3. **Feature modules** (auth, todos, settings) — Each owns its components, hooks, and services with public API exports
4. **MainLayout** — Sidebar + content wrapper for all authenticated pages
5. **Service layer** — authService, todoService, settingsService — thin wrappers around apiClient

### Critical Pitfalls

1. **JWT Token Refresh Race Condition** — Multiple parallel requests trigger simultaneous refreshes, causing cascading failures. **Avoid:** Singleton refresh pattern with promise deduplication, `_retry` flag on request config, failed request queue.
2. **Storing JWT in localStorage (XSS)** — Any JavaScript can steal tokens. **Avoid:** Since API is external and httpOnly cookies aren't possible, use localStorage pragmatically but add CSP headers, audit dependencies, keep token lifetime short.
3. **Protected Route Flash** — Dashboard content visible before auth check completes. **Avoid:** Three-state auth check (loading/authenticated/unauthenticated), render spinner while loading.
4. **Infinite Redirect Loop on Refresh Failure** — Expired refresh token causes interceptor to loop. **Avoid:** `_retry` flag, separate refresh failure handling (force logout + redirect to login).
5. **CORS and API Version Handling** — TalTech API requires `/v1/` prefix and CORS differs from localhost. **Avoid:** Vite dev server proxy, centralized apiClient with correct baseURL.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & API Client
**Rationale:** Every feature depends on the API client with interceptors. This must exist before auth, todos, or settings can be built. Establishes project structure, build tooling, and shared components.
**Delivers:** Vite + React 19 + Tailwind 4 setup, project structure, Axios client with interceptors (request: Bearer token, response: 401 handling), shared UI components (Button, Input, LoadingSpinner, Modal), MainLayout skeleton
**Addresses:** CORS handling, API version prefixing (`/v1/`), Vite dev proxy configuration
**Avoids:** Pitfall 6 (CORS/API version) — centralized client from day one; Pitfall 5 (over-engineering) — no state library, just Context + local state

### Phase 2: Authentication
**Rationale:** All task endpoints require authentication. Auth must be fully working (login, register, token refresh, protected routes) before any data-fetching components.
**Delivers:** AuthContext with three-state auth check, LoginPage, RegisterPage, ProtectedRoute with loading state, AuthenticatedRoute (redirects logged-in users away from login), authService (login, register, refresh, logout), token refresh interceptor with singleton pattern and request queue
**Addresses:** JWT auto-refresh, protected routes, session restoration on page reload
**Avoids:** Pitfall 1 (refresh race condition) — singleton pattern with queue; Pitfall 3 (route flash) — three-state auth check; Pitfall 4 (infinite redirect loop) — `_retry` flag + refresh failure handling; Pitfall 2 (localStorage XSS) — CSP headers, dependency audit

### Phase 3: Todo Core
**Rationale:** This is the primary user-facing functionality. Depends on auth being complete. Users judge todo apps by how quickly they can add and complete tasks.
**Delivers:** TodoService, useTodos/useTodoMutations hooks, TodoList with TodoCard components, TodoForm (create/edit with validation), DashboardPage, task completion toggle, task deletion with confirmation
**Addresses:** Task CRUD, task filtering by category, priority display, loading/error/empty states
**Avoids:** Pitfall 7 (useEffect dependency bugs) — exhaustive-deps lint rule; Pitfall 8 (missing error states) — three-state UI for every data fetch

### Phase 4: Settings
**Rationale:** Same architectural pattern as todos (service → hook → component) but for categories and priorities. Can be built after todos because the pattern is established. Settings changes must be reflected in sidebar.
**Delivers:** SettingsService, useCategories/usePriorities hooks, CategoryManager component, PriorityManager component, SettingsPage with sub-panels
**Addresses:** Category CRUD, priority CRUD, settings UI
**Avoids:** Pitfall 5 (over-engineering) — reuse same pattern as todos, no new abstractions

### Phase 5: Integration & Polish
**Rationale:** Sidebar wiring needs both categories and todos to exist. Docker deployment is orthogonal to user-facing features. This phase ties everything together.
**Delivers:** Sidebar with category filter wired to TodoList, priority icons on task cards, routing polish (redirects, loading states, empty states), Docker multi-stage build with nginx, nginx `try_files` for SPA routing
**Addresses:** Docker deployment, sidebar navigation, priority icons
**Avoids:** Pitfall 9 (Docker SPA routing) — `try_files` directive; Pitfall 8 (missing error states) — verify all components have error UI

### Phase Ordering Rationale

- **Foundation first** because every feature imports the API client. Without interceptors, auth and todos can't work correctly.
- **Auth before todos** because all TalTech API task endpoints require valid JWT tokens. Protected routes depend on auth context.
- **Todos before settings** because todos are the primary user value. Settings (categories/priorities) are organizational — they need to exist before they can be customized, but the CRUD pattern is identical to todos.
- **Integration last** because sidebar wiring requires both categories and todos to exist. Docker deployment doesn't affect user experience and can be done in parallel with polish.
- **This ordering avoids pitfalls** by establishing the API client before any component makes requests, implementing the refresh interceptor before protected routes exist, and testing Docker routing before declaring deployment complete.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Authentication):** Token refresh queue implementation details need careful review against the TalTech API's specific refresh endpoint behavior (does it require both `jwt` and `refreshToken` in the body?).
- **Phase 5 (Integration):** Docker nginx configuration for SPA routing with potential API proxying needs verification against the actual deployment environment.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented Vite 8 + React 19 + Tailwind 4 setup. Official docs are sufficient.
- **Phase 3 (Todo Core):** Standard CRUD pattern. Same architecture as any data-fetching React feature.
- **Phase 4 (Settings):** Identical pattern to Phase 3, just different endpoints. No new concepts.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified against official docs (React, Vite, React Router, Tailwind, Axios). Version compatibility confirmed. |
| Features | HIGH | Based on 2026 market analysis (Zapier, Toolradar), competitor comparison, and explicit project requirements from PROJECT.md and TalTech API spec. |
| Architecture | HIGH | Feature-based structure, Context + local state, Axios interceptors — all standard patterns with multiple authoritative sources. |
| Pitfalls | HIGH | Each pitfall documented with specific prevention strategies, warning signs, and phase mapping. Sources include recent (2025-2026) articles. |

**Overall confidence:** HIGH

### Gaps to Address

- **TalTech API refresh endpoint exact contract:** The API spec says refresh requires both `jwt` and `refreshToken` in the body, but the exact response shape (does it return a new refresh token or just access token?) needs validation during implementation.
- **CORS behavior in production Docker deployment:** Vite dev proxy handles development, but production nginx may need API proxy configuration depending on whether the Docker container runs alongside or separate from the API.
- **Token lifetime:** The access token and refresh token expiration durations are not specified. This affects how often users will experience refresh vs. re-login.

## Sources

### Primary (HIGH confidence)
- `/vitejs/vite` — Vite 8 configuration, React plugin setup, build optimization
- `/remix-run/react-router` — React Router 7 SPA mode, client loaders, protected routes
- `/axios/axios-docs` — Axios interceptors, JWT token refresh pattern, error handling
- `/pmndrs/zustand` — Zustand store setup, persist middleware, TypeScript patterns
- https://react.dev/blog/2025/10/01/react-19-2 — React 19.2 release notes
- https://github.com/vitejs/vite/releases/tag/v8.0.0 — Vite 8.0 release
- https://reactrouter.com/7.13.1/how-to/spa — React Router SPA mode guide
- https://tailwindcss.com/docs/installation — Tailwind CSS v4 Vite installation
- https://github.com/facebook/react/releases/tag/v19.2.4 — React 19.2.4 release

### Secondary (MEDIUM confidence)
- https://zapier.com/blog/best-todo-list-apps/ — 2026 todo app ecosystem review
- https://www.toolradar.com/guides/best-task-management-apps — Feature comparison, evaluation criteria
- https://jsmanifest.com/jwt-security-best-practices-2026 — JWT security tips for 2026
- https://hoop.dev/blog/the-hidden-pitfalls-of-jwt-based-authentication — JWT pitfalls
- https://dev.to/tai_tran_36c0d039fde1e560/handling-jwt-refresh-tokens-in-axios-without-the-headache-56nb — JWT refresh with Axios
- https://oneuptime.com/blog/post/2026-01-15-secure-react-jwt-authentication/view — Secure React JWT auth
- https://oneuptime.com/blog/post/2026-01-15-configure-nginx-production-react-spa/view — Nginx for React SPAs
- https://dev.to/it-wibrc/guide-to-containerizing-a-modern-javascript-spa-vuevitereact-with-a-multi-stage-nginx-build-1lma — Multi-stage Docker + nginx SPA deployment

### Tertiary (LOW confidence)
- Project specification: `.planning/PROJECT.md` — Authoritative requirements
- TalTech API OpenAPI spec — Defines available endpoints and fields (needs validation during implementation)

---
*Research completed: 2026-04-03*
*Ready for roadmap: yes*
