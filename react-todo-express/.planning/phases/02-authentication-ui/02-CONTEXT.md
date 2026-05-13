# Phase 2: Authentication UI - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Login, register, logout flows with protected routes and session persistence. Users can securely create accounts, log in, and access protected areas. The infrastructure is already in place (Zustand store with persist, API client with JWT interceptors) — this phase builds the actual UI and routing protection.

Covers requirements: AUTH-01, AUTH-02, AUTH-03, AUTH-06, AUTH-07, AUTH-08

</domain>

<decisions>
## Implementation Decisions

### Form Layout
- **D-01:** Centered card on full-page background (like current placeholder, but with actual form)
- **D-02:** Login and register are separate pages at /login and /register (not a toggle)
- **D-03:** Register form includes: email, password, first name, last name, and confirm password

### Validation
- **D-04:** Inline field validation on blur — each field validates when user leaves it, red error text below the field
- **D-05:** Password confirmation field validates against password field on blur

### Protected Routes
- **D-06:** ProtectedRoute wrapper component that checks auth state and renders children or `<Navigate to="/login" />`
- **D-07:** Unauthenticated users redirected to /login with return path saved (redirect back after login)
- **D-08:** Authenticated users visiting /login or /register are redirected to /dashboard
- **D-09:** Loading spinner shown while Zustand persist rehydrates from localStorage on page reload — prevents flash of wrong page

### Error Handling
- **D-10:** API errors displayed as inline field-level errors (red text below the specific field that failed)
- **D-11:** Network/unreachable errors shown as a generic message at top of form: "Unable to connect. Please check your connection and try again."
- **D-12:** Errors clear when user starts typing in the affected field
- **D-13:** Submit button shows spinner and becomes disabled while API request is in progress

### Navigation & Logout
- **D-14:** Top navbar with user greeting ("Hi, {firstName}") and logout button
- **D-15:** Dashboard layout reserves space for empty sidebar (Phase 4 will populate it) — avoids layout shift later
- **D-16:** Logout clears auth store and redirects to /login immediately
- **D-17:** User greeted with "Hi, {firstName}" in navbar

### the agent's Discretion
- Exact card styling (shadow intensity, border radius, padding)
- Loading spinner design (size, animation style)
- Exact error message wording beyond the network error template
- CSS transition timing for form state changes

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication
- `.planning/REQUIREMENTS.md` §Authentication — AUTH-01 through AUTH-08 requirements, which ones this phase covers
- `.planning/PROJECT.md` §Context — API authentication flow, login/register response shape, refresh token behavior
- `src/types/auth.ts` — AuthState, LoginPayload, RegisterPayload, LoginResponse type contracts
- `src/stores/useAuthStore.ts` — Zustand store with persist middleware, setAuth/clearAuth interface

### API Client
- `src/lib/apiClient.ts` — Axios instance with JWT interceptors, auto-refresh on 401, queued retry logic

### Routing
- `src/App.tsx` — Current route structure (BrowserRouter, Routes, placeholder routes)
- `.planning/ROADMAP.md` §Phase 2 — Phase goal, success criteria, dependencies

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/useAuthStore.ts` — Zustand auth store with persist middleware, already handles token/refreshToken/firstName/lastName. No changes needed, just consume it.
- `src/lib/apiClient.ts` — Axios client factory with JWT interceptors and auto-refresh. Use this for login/register API calls.
- `src/types/auth.ts` — LoginPayload, RegisterPayload, LoginResponse interfaces. Ready to use.
- `src/features/auth/pages/LoginPage.tsx` — Placeholder page, replace with actual login form.
- `src/features/auth/pages/RegisterPage.tsx` — Placeholder page, replace with actual register form.
- `src/features/dashboard/pages/DashboardPage.tsx` — Placeholder page, add navbar + greeting here.

### Established Patterns
- Feature-based directory structure (`src/features/{feature}/pages/`)
- Tailwind CSS utility classes for styling
- TypeScript interfaces for all data contracts
- Zustand with persist middleware for state that survives page reload

### Integration Points
- `src/App.tsx` — Add ProtectedRoute wrapper around /dashboard route, add redirect logic for /login and /register
- `src/main.tsx` — No changes needed, entry point is fine
- Zustand persist rehydration is async — need to handle loading state before auth state is known

</code_context>

<specifics>
## Specific Ideas

- User wants confirm password field on registration (beyond what API requires — client-side validation)
- Sidebar space reserved now to avoid layout shift when Phase 4 adds the actual sidebar
- Errors clear on field change, not on next submit — immediate feedback preferred

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-authentication-ui*
*Context gathered: 2026-04-03*
