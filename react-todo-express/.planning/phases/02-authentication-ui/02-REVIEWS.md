---
phase: 2
reviewers: [self-review]
reviewed_at: 2026-04-03T00:00:00.000Z
plans_reviewed: [02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md]
---

# Self-Review — Phase 2: Authentication UI

> No external AI CLIs available (gemini, claude, codex all missing). Performing self-review analysis.

## Summary

Phase 2 plans are well-structured and comprehensive, covering login, registration, and protected route infrastructure across three coordinated plans. The plans demonstrate strong attention to detail with explicit acceptance criteria, dark theme specifications, accessibility considerations, and clear error handling strategies. The dependency chain (Plans 01+02 → Plan 03) is logical. However, there are several gaps around edge cases, security hardening, and API contract assumptions that should be addressed before execution.

## Strengths

- **Explicit acceptance criteria** — Each plan has 10+ verifiable acceptance criteria with regex patterns, making automated verification straightforward
- **Consistent design system** — Dark theme (zinc/amber palette) is specified uniformly across all three plans, referencing a shared UI-SPEC
- **Clear error handling taxonomy** — Plans distinguish between 4xx field-level errors, 409 conflicts, and network errors with specific user-facing messages
- **Accessibility first** — Labels, aria-describedby, autoFocus, and 44px touch targets are specified, not afterthoughts
- **Rehydration handling** — Plan 03 correctly addresses the Zustand persist async rehydration flash with isLoading state and onRehydrateStorage callback
- **Forward-thinking layout** — Reserved sidebar space in DashboardPage prevents layout shift when Phase 4 populates it
- **Good separation of concerns** — PublicRoute (Plan 01) vs ProtectedRoute (Plan 03) with clear distinct responsibilities
- **Key links documented** — Plans specify exact integration points between files with regex patterns for verification

## Concerns

### HIGH

1. **Missing password strength validation** (Plan 02) — Password validation only checks "required + minimum 6 characters." The API may have stricter requirements. Without knowing the API's password policy, users could register with weak passwords that the API rejects with unclear errors. **Recommendation:** Check API spec for password requirements or add client-side strength hints (min length, special chars, etc.) matching API constraints.

2. **No rate limiting / abuse protection awareness** (Plans 01, 02) — Login and registration endpoints are common targets for brute force. Plans don't account for potential account lockout scenarios or rate limit responses (HTTP 429). **Recommendation:** Add handling for 429 responses with user-friendly "Too many attempts, please wait" messaging.

3. **Return path redirect logic incomplete** (Plan 03) — ProtectedRoute saves `state={{ from: location.pathname }}` on redirect, but Plan 01's LoginPage doesn't read this state to redirect back after successful login. The login plan only navigates to `/dashboard`. **Recommendation:** Update Plan 01's submit handler to check `location.state?.from` and redirect there instead of hardcoded `/dashboard`.

### MEDIUM

4. **No "remember me" or extended session option** — Zustand persist stores tokens in localStorage indefinitely. No mechanism exists for explicit logout on shared devices or session timeout awareness. For a school project this is acceptable, but worth noting.

5. **Confirm password field order** (Plan 02) — Field order is Email → Password → Confirm Password → First Name → Last Name. This splits the personal info fields (first/last name) from the email field, which is inconsistent. **Recommendation:** Consider Email → First Name → Last Name → Password → Confirm Password for better logical grouping.

6. **No loading state on register page during API call** — Plan 02 specifies `isSubmitting` with spinner/disabled button, but doesn't specify what happens if the user navigates away mid-request. The API call would complete but the Zustand store might not update if the component unmounts. **Recommendation:** Add abort controller or note that React 19 handles unmount cleanup for pending requests.

7. **Plan 03 modifies useAuthStore.ts** — Adding `isLoading` to the store affects Phase 1's established contract. If Phase 1 tests or other components depend on the store shape, this could cause issues. The plan notes this but doesn't include a migration strategy.

8. **No handling for expired tokens on page reload** — The plans assume Zustand persist will restore a valid session. If the token expired while the browser was closed, the user sees a logged-in state briefly before the first API call returns 401. The interceptor handles refresh, but if the refresh token is also expired, the user gets a confusing experience. **Recommendation:** Add a note about the refresh interceptor's behavior when both tokens are expired — it should clear auth and redirect to login.

### LOW

9. **No "forgot password" flow** — Explicitly out of scope for this phase, but the login page has no link or mention. Users who forget their password have no recourse. Fine for v1, but the absence should be documented.

10. **Hardcoded error messages** (Plans 01, 02) — Error strings like "Invalid email or password. Please try again." are hardcoded in the component. For a school project this is fine, but it prevents i18n later. **Recommendation:** Consider extracting to a constants file or error map.

11. **No form reset after successful submission** — After login/register success, the component navigates away immediately, so form state cleanup doesn't matter. But if navigation fails for any reason, the form would still contain sensitive data (passwords). **Recommendation:** Clear form fields after successful API response before navigation.

12. **Plan 01 mentions 02-UI-SPEC.md** — This file is referenced but its existence hasn't been confirmed in the context gathering. If it doesn't exist, the executing agent will need to make styling decisions independently.

## Suggestions

1. **Add 429 handling** to both login and register error handlers with a user-friendly cooldown message
2. **Wire up return path redirect** in LoginPage — read `useLocation().state?.from` and navigate there on success
3. **Reorder registration fields** to group personal info together: Email → First Name → Last Name → Password → Confirm Password
4. **Add password strength requirements** to Plan 02 validation — match API constraints or add progressive strength indicator
5. **Document refresh token expiry behavior** — what happens when both tokens are expired on reload
6. **Clear form fields** after successful API response before navigation
7. **Verify 02-UI-SPEC.md exists** before execution or provide fallback styling defaults

## Risk Assessment

**Overall Risk: LOW-MEDIUM**

The plans are well-designed for a school project context. The primary risks are:
- The return path redirect gap (HIGH) would cause a UX issue where users always land on /dashboard after login instead of their intended page
- Missing password strength validation (HIGH) could cause registration failures if the API has stricter requirements than assumed
- The 429 handling gap (HIGH) is unlikely in a school project context but represents a real-world gap

These are all fixable with minor plan adjustments and don't require restructuring.

---

## Consensus Summary

> Single reviewer (self-review). No cross-AI consensus available.

### Agreed Strengths

- Comprehensive acceptance criteria with automated verification
- Consistent dark theme design system across all plans
- Clear error handling taxonomy (4xx vs network vs conflict)
- Accessibility considerations built in from the start
- Rehydration flash prevention with isLoading state
- Forward-thinking layout with reserved sidebar space

### Agreed Concerns

- Return path redirect not wired from ProtectedRoute → LoginPage
- Password validation too minimal (6 chars only, no strength check)
- No 429 rate limit response handling
- Registration field order splits personal info fields
- No documented behavior for double-expired tokens (access + refresh)

### Divergent Views

> Not applicable — single reviewer.
