# Pitfalls Research

**Domain:** React Todo App with JWT Authentication
**Researched:** 2026-04-03
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: JWT Token Refresh Race Condition

**What goes wrong:**
When the access token expires and multiple parallel API requests fire simultaneously (e.g., dashboard loading categories, priorities, and tasks), each request independently detects a 401 and attempts to refresh the token. The first refresh succeeds, but subsequent refresh calls either invalidate the first token or cause cascading failures. The user gets randomly logged out despite having valid credentials.

**Why it happens:**
Developers implement a naive 401 interceptor that triggers a refresh without checking if a refresh is already in progress. Each concurrent request sees its own 401 and independently calls the refresh endpoint. The TalTech API's refresh endpoint may invalidate the previous refresh token on each call, making this especially destructive.

**How to avoid:**
Implement a singleton refresh pattern — store the refresh promise on a centralized auth store. When multiple requests detect 401 simultaneously, the first triggers the refresh and all others await the same promise. Use the `_retry` flag on the original request config to prevent infinite retry loops. Consider using `axios-auth-refresh-queue` (641 bytes gzipped) which handles this pattern out of the box.

```javascript
// Singleton refresh pattern
class AuthStore {
  refreshPromise = null;

  async refreshToken() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = api.post('/auth/refresh', { jwt, refreshToken })
      .then(res => { /* save tokens */ })
      .finally(() => { this.refreshPromise = null; });
    return this.refreshPromise;
  }
}
```

**Warning signs:**
- User reports "random logouts" when opening the app after being idle
- Multiple refresh requests visible in network tab during a single page load
- `_retry` flag not present on interceptor logic
- Token refresh logic lives in individual components instead of a centralized HTTP client

**Phase to address:**
Authentication Infrastructure Phase — must be implemented before any protected routes or data-fetching components.

---

### Pitfall 2: Storing JWT Tokens in localStorage (XSS Vulnerability)

**What goes wrong:**
Tokens stored in `localStorage` or `sessionStorage` are accessible to any JavaScript running on the page. A single XSS attack — through a compromised npm dependency, malicious browser extension, or injected script — can exfiltrate both the access token and refresh token, giving the attacker full account access.

**Why it happens:**
localStorage is the easiest approach. Most React tutorials and blog posts use it because it requires zero server-side configuration. The trade-off (XSS vs CSRF) is rarely explained in beginner resources.

**How to avoid:**
For a school project where the API is external (taltech.akaver.com) and you cannot set httpOnly cookies server-side, localStorage is the pragmatic choice. However, mitigate risk by: (1) implementing strict Content Security Policy headers, (2) auditing all npm dependencies for known vulnerabilities, (3) keeping access token lifetime short, (4) never storing sensitive data (passwords, PII) in tokens. If you had control of the backend, httpOnly cookies with SameSite=Strict would be the correct answer.

**Warning signs:**
- Tutorial code copy-pasted without understanding the security trade-off
- No CSP meta tag in index.html
- Dependencies not audited (`npm audit` not run)
- Token payload contains sensitive user data (decode a JWT at jwt.io to check)

**Phase to address:**
Authentication Infrastructure Phase — token storage strategy must be decided before auth context is built.

---

### Pitfall 3: Protected Route Flash (Authentication Flicker)

**What goes wrong:**
When the app loads, it checks authentication state (e.g., from localStorage or context). During this check, the protected route renders briefly before the auth check completes, causing a visible flash of the dashboard content before redirecting to login. Alternatively, the app shows a loading spinner indefinitely because the auth state is never properly initialized.

**Why it happens:**
React Router's protected routes check `isAuthenticated` synchronously, but the auth state is loaded asynchronously (reading from localStorage, validating token, etc.). Without an explicit `isLoading` state, the route makes a decision before it has the data.

**How to avoid:**
Implement a three-state auth check: `authenticated`, `unauthenticated`, and `loading`. The protected route should render a loading indicator while auth state is being determined, then decide to render children or redirect.

```jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}
```

**Warning signs:**
- Dashboard content visible for a split second before redirect to login
- `isAuthenticated` defaults to `false` with no loading state
- No splash/loading screen during initial auth hydration
- Token validation happens inside the route component instead of before routing

**Phase to address:**
Routing & Navigation Phase — after auth context exists but before protected routes are wired up.

---

### Pitfall 4: Infinite Redirect Loop on Refresh Token Failure

**What goes wrong:**
When the refresh token itself is expired or invalid, the 401 interceptor attempts to refresh, gets another 401, and enters an infinite loop of refresh attempts. The app becomes unusable — either frozen or continuously redirecting between login and dashboard.

**Why it happens:**
The interceptor's error handler doesn't distinguish between "access token expired" (refreshable) and "refresh token expired" (requires re-login). Without a `_retry` flag or proper error differentiation, every failed refresh triggers another refresh attempt.

**How to avoid:**
The interceptor must: (1) use the `_retry` flag to prevent re-processing the same request, (2) catch refresh endpoint failures separately and force logout + redirect to login, (3) never attempt to refresh if no refresh token exists. The refresh endpoint response (or lack thereof) should be the definitive signal that the session is dead.

**Warning signs:**
- Browser network tab shows repeated calls to `/auth/refresh` in rapid succession
- App freezes or continuously redirects after being idle for a long period
- No logout logic in the 401 interceptor's catch block
- Refresh token not validated before calling refresh endpoint

**Phase to address:**
Authentication Infrastructure Phase — must be implemented alongside the token refresh interceptor.

---

### Pitfall 5: Over-Engineering State Management for a Todo App

**What goes wrong:**
Introducing Redux, RTK Query, or complex state libraries for a todo app that has maybe 5-6 pieces of state (auth tokens, user info, tasks, categories, priorities). The boilerplate (actions, reducers, selectors, store setup) outweighs the actual app logic, making the codebase harder to understand and maintain — especially for a school project where the goal is demonstrating competency, not enterprise architecture.

**Why it happens:**
Tutorials often pair React with Redux by default. Developers assume "real apps use Redux" without considering whether the complexity is justified. The fear of "what if we need to scale" leads to premature abstraction.

**How to avoid:**
Use React Context + `useReducer` for auth state and a simple custom hook or component-level state for todo data. If server-state caching is needed, consider React Query (TanStack Query) which handles caching, deduplication, and refetching without Redux boilerplate. For this project scope, Context + useReducer for auth and useState/useEffect for todo data is sufficient and demonstrates solid React fundamentals.

**Warning signs:**
- More boilerplate files (actions, reducers, types) than actual feature code
- Simple state updates require dispatching actions through multiple layers
- `useSelector` calls for single values that could be props
- Team members can't explain the data flow without a diagram

**Phase to address:**
State Management Phase — should be decided during architecture planning, before any data-fetching components are built.

---

### Pitfall 6: Missing CORS and API Version Handling with External API

**What goes wrong:**
The TalTech API at `taltech.akaver.com` is a different origin than the React dev server (`localhost:5173` or `localhost:3000`). Without proper CORS configuration or a dev proxy, all API calls fail with CORS errors. Additionally, the API requires a version parameter in the path (`v1`), and forgetting this causes 404s that are hard to debug.

**Why it happens:**
Developers test against the API without checking CORS preflight requirements. The API version path segment (`/v1/`) is easy to forget when constructing URLs, especially if the base URL configuration doesn't include it.

**How to avoid:**
Configure Vite's dev server proxy to forward `/api` requests to `taltech.akaver.com`, eliminating CORS during development. For production Docker deployment, configure nginx to proxy API requests or set proper CORS headers. Always include the API version in the axios instance's `baseURL`:

```javascript
const apiClient = axios.create({
  baseURL: 'https://taltech.akaver.com/v1',
});
```

In `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'https://taltech.akaver.com',
      changeOrigin: true,
    },
  },
}
```

**Warning signs:**
- CORS errors in browser console on first API call
- API calls work in Postman but fail in the browser
- 404 responses on valid endpoints (missing `/v1/` prefix)
- Hardcoded URLs scattered across components instead of centralized in one HTTP client

**Phase to address:**
API Integration Phase — before any component makes API calls.

---

## Moderate Pitfalls

### Pitfall 7: useEffect Dependency Array Bugs

**What goes wrong:**
Missing or incorrect dependency arrays in `useEffect` cause stale closures, infinite loops, or effects that never re-run. Common in todo apps when fetching tasks on category change — if `categoryId` is missing from deps, the task list never updates when switching categories.

**Why it happens:**
React's exhaustive-deps lint rule is often disabled or ignored. Developers add empty `[]` arrays to "run once" without realizing the captured values become stale.

**How to avoid:**
Always include the exhaustive-deps lint rule. If an effect should re-run when a value changes, include it in deps. If it causes infinite loops, the problem is usually the dependency changing on every render (e.g., an object or function reference) — fix that with `useMemo` or `useCallback` instead of removing the dep.

**Warning signs:**
- `useEffect` with empty dependency array `[]` that references props or state
- ESLint `react-hooks/exhaustive-deps` rule disabled
- Data not updating when expected (stale closure)
- Infinite re-render loops in development mode

**Phase to address:**
Component Implementation Phase — enforced via ESLint configuration from project setup.

### Pitfall 8: Not Handling API Error States in UI

**What goes wrong:**
Components assume API calls always succeed. When the API returns an error (network failure, 500, rate limit), the UI shows a loading spinner forever or displays broken/incomplete data. The user has no feedback about what went wrong or how to recover.

**Why it happens:**
Happy-path development — testing only works when the API responds correctly. Error states are an afterthought.

**How to avoid:**
Every data-fetching operation should handle three states: `loading`, `success`, and `error`. Display appropriate UI for each. Include a retry mechanism for transient failures.

**Warning signs:**
- No error state variable alongside loading/data state
- `catch` blocks in API calls are empty or only `console.error`
- Loading spinner that never disappears on API failure
- No user-facing error messages or retry buttons

**Phase to address:**
Component Implementation Phase — build error handling alongside each feature, not as an afterthought.

### Pitfall 9: Docker SPA Routing Without Nginx Fallback

**What goes wrong:**
The Docker container serves the React build, but navigating directly to a route like `/dashboard` or refreshing the page returns a 404. This happens because the SPA uses client-side routing (React Router) but the nginx server only has the physical `index.html` file and doesn't know to serve it for all routes.

**Why it happens:**
Developers test the Docker container only by navigating from the root path. Direct URL access and page refreshes are not tested.

**How to avoid:**
Configure nginx with `try_files $uri $uri/ /index.html;` to serve `index.html` for all non-file requests, allowing React Router to handle client-side routing.

```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
  }
}
```

**Warning signs:**
- App works when navigating from homepage but 404s on direct URL access
- Dockerfile copies build but doesn't include nginx config
- No `try_files` directive in nginx configuration
- Only tested by clicking links, never by refreshing or typing URLs

**Phase to address:**
Docker Deployment Phase — test direct URL access and page refreshes as part of deployment verification.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing tokens in localStorage | Zero server config, works immediately | XSS vulnerability, token theft risk | Acceptable for school project with external API; never for production with sensitive data |
| Skipping `_retry` flag on interceptor | Simpler code initially | Infinite redirect loops on refresh failure | Never — this is a one-line fix that prevents catastrophic failure |
| Hardcoded API URLs in components | Fast initial development | Impossible to switch environments, CORS headaches | Never — use a centralized HTTP client from day one |
| No error boundaries in React | Fewer components to write | Entire app crashes on single component error | Maybe for MVP demo, but should be added before any real usage |
| `any` types or no TypeScript | Faster prototyping | Runtime errors that could be caught at compile time | Acceptable for a pure JS school project; not acceptable if TS is a requirement |
| Disabling exhaustive-deps lint rule | Stops annoying warnings | Stale closures, infinite loops, unpredictable behavior | Never — fix the root cause instead |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TalTech API (taltech.akaver.com) | Forgetting `/v1/` version prefix in URL paths | Include version in axios `baseURL`: `'https://taltech.akaver.com/v1'` |
| TalTech API | Not sending both `jwt` and `refreshToken` on refresh | Check API spec — refresh endpoint requires both tokens in request body |
| TalTech API | Assuming CORS is configured for localhost | Use Vite dev proxy in development; configure nginx proxy for production |
| Axios interceptors | Attaching interceptor to default axios instance instead of a custom instance | Create a dedicated `apiClient` instance and attach interceptors there |
| React Router v6 | Using v5 `<Route component={}>` syntax | Use v6 `<Route element={<Component />}>` and `createBrowserRouter` |
| Token storage on page reload | Tokens in context/state lost on refresh, app thinks user is logged out | Hydrate auth state from localStorage on app initialization |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all tasks on every render | UI lag, excessive API calls, rate limiting | Cache task list, only refetch on mutations or explicit refresh | Breaks at ~50+ tasks with frequent category switches |
| Re-rendering entire task list on single task toggle | Visible lag, unnecessary API calls | Use React.memo on task items, update only changed item in state | Noticeable at ~20+ tasks |
| Unmemoized context value | Every context consumer re-renders on any state change | Wrap context value in `useMemo` | Breaks with 5+ context consumers on any state update |
| Loading all categories/priorities individually | N+1 API calls, slow initial load | Fetch all categories/priorities in a single call and cache | Noticeable at ~10+ categories |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing JWT in localStorage without CSP | XSS can steal tokens, full account takeover | Add CSP meta tag, audit dependencies, keep token lifetime short |
| Sending refresh token in URL params | Token logged in server logs, browser history, proxy logs | Always send refresh token in request body, never in URL |
| Not validating token before sending API requests | Sending expired tokens, unnecessary 401s, refresh storms | Check token expiration client-side before making requests |
| Exposing API keys or secrets in frontend bundle | Anyone can extract and misuse credentials | Never embed secrets in frontend code; use environment variables only for non-secret config |
| Missing rate limiting awareness on auth endpoints | Account lockout from too many failed login attempts | Implement exponential backoff on login failures, show user-friendly error messages |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during login | User clicks "Login" multiple times, submits form repeatedly | Disable submit button and show spinner during authentication |
| Silent token refresh failure | User suddenly logged out with no explanation | Show "Session expired, please log in again" message before redirecting |
| No feedback on task actions | User doesn't know if task was created/updated/deleted | Show toast notifications or inline confirmation for all CRUD operations |
| Category filter resets on page refresh | User loses their filtered view | Persist selected category in URL query params or localStorage |
| Form data lost on navigation | User fills out task form, navigates away, loses all input | Warn on unsaved changes or auto-draft to localStorage |

## "Looks Done But Isn't" Checklist

- [ ] **Authentication:** Often missing token refresh on page reload — verify app re-hydrates auth state from localStorage on mount
- [ ] **Protected Routes:** Often missing loading state — verify route shows spinner while auth is being determined, not a flash of content or redirect
- [ ] **Token Refresh:** Often missing race condition handling — verify only one refresh request fires even with 5+ parallel API calls
- [ ] **API Integration:** Often missing API version prefix — verify all URLs include `/v1/` in the path
- [ ] **Error Handling:** Often missing error state UI — verify every data fetch has loading, success, and error states with user-visible feedback
- [ ] **Docker Deployment:** Often missing SPA routing fallback — verify direct URL access and page refresh work, not just navigation from homepage
- [ ] **Logout:** Often missing cleanup — verify auth state, localStorage tokens, and pending requests are all cleared on logout
- [ ] **Form Validation:** Often missing client-side validation — verify form rejects empty/invalid input before making API call

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Token refresh race condition | MEDIUM | Refactor interceptor to use singleton refresh pattern; add `_retry` flag; test with parallel requests |
| localStorage XSS exposure | LOW | Add CSP headers, audit dependencies, document the trade-off; migrate to httpOnly cookies if backend allows |
| Protected route flicker | LOW | Add `isLoading` state to auth context; update ProtectedRoute to render loading indicator |
| Infinite redirect loop | LOW | Add `_retry` flag check; separate refresh failure handling from access token failure |
| Over-engineered state | HIGH | Refactor Redux to Context + useReducer; remove unnecessary boilerplate files |
| CORS/API version issues | LOW | Centralize API client with correct baseURL; add Vite dev proxy |
| Docker SPA routing | LOW | Add nginx `try_files` directive; rebuild and test |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Token refresh race condition | Authentication Infrastructure | Fire 5+ parallel API calls with expired token; verify only 1 refresh request |
| localStorage XSS vulnerability | Authentication Infrastructure | Run `npm audit`; verify CSP meta tag in index.html; decode JWT to confirm no sensitive data |
| Protected route flash | Routing & Navigation | Open app while logged out; verify no dashboard content visible before redirect |
| Infinite redirect loop | Authentication Infrastructure | Let refresh token expire; verify clean redirect to login with no loop |
| Over-engineered state management | Architecture & State Planning | Count state management files vs feature files; ratio should favor features |
| CORS and API version handling | API Integration | All API calls succeed in dev mode; no CORS errors in console |
| useEffect dependency bugs | Component Implementation | ESLint exhaustive-deps rule enabled with zero warnings |
| Missing error states in UI | Component Implementation | Disconnect network; verify error UI appears for every data-fetching component |
| Docker SPA routing | Docker Deployment | Navigate to `/dashboard` directly; verify page loads without 404 |

## Sources

- "JWT Best Practices: Security Tips for 2026" — jsmanifest (March 2026) — https://jsmanifest.com/jwt-security-best-practices-2026
- "The Hidden Pitfalls of JWT-Based Authentication" — Hoop.dev (October 2025) — https://hoop.dev/blog/the-hidden-pitfalls-of-jwt-based-authentication
- "Handling JWT Refresh Tokens in Axios without the Headache" — DEV Community (January 2026) — https://dev.to/tai_tran_36c0d039fde1e560/handling-jwt-refresh-tokens-in-axios-without-the-headache-56nb
- "JWT Refresh with Axios Interceptors in React" — DEV Community (July 2024) — https://dev.to/ayon_ssp/jwt-refresh-with-axios-interceptors-in-react-2bnk
- "Refreshing new access token using reacjs" — Prodopsy (February 2026) — https://prodopsy.com/refreshing-new-access-token-using-reacjs/
- "Race Conditions in JWT Refresh Token Rotation" — DEV Community (May 2025) — https://dev.to/silentwatcher_95/race-conditions-in-jwt-refresh-token-rotation-3j5k
- "How to Secure React Applications with JWT Authentication" — OneUptime (January 2026) — https://oneuptime.com/blog/post/2026-01-15-secure-react-jwt-authentication/view
- "Secure Token Storage in React" — IGNEK (October 2025) — https://www.ignek.com/blog/secure-token-storage-react-best-practices/
- "React Authentication Best Practices (2025 Edition)" — LinkedIn (July 2025)
- "Stop Overengineering React State: Zustand vs Redux Toolkit in 2025" — Markaicode (September 2025)
- "How to Configure Nginx for Production React SPAs" — OneUptime (January 2026) — https://oneuptime.com/blog/post/2026-01-15-configure-nginx-production-react-spa/view
- "Flash of protected route's content with React Router 6" — Stack Overflow (May 2022) — https://stackoverflow.com/questions/72362977/flash-of-protected-routes-content-with-react-router-6

---
*Pitfalls research for: React Todo App with JWT Authentication*
*Researched: 2026-04-03*