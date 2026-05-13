# Phase 2: Authentication UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 02-authentication-ui
**Areas discussed:** Form Design, Protected Routes, Error Handling, Logout & Navigation

---

## Form Design

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card on full page | Single centered card on a full-height background. Clean, focused. | ✓ |
| Split screen layout | Left side branding/illustration, right side form. | |
| Minimal centered form without card | Just form fields, no card/shadow/border. | |

**User's choice:** Centered card on full page

| Option | Description | Selected |
|--------|-------------|----------|
| Inline field validation on blur | Each field validates when user leaves it. Red error text below field. | ✓ |
| Form-level validation on submit | All fields validate on submit click. | |
| Both inline on blur AND on submit | Inline catches early, submit catches missed. | |

**User's choice:** Inline field validation on blur

| Option | Description | Selected |
|--------|-------------|----------|
| Separate pages | /login and /register as distinct pages. Cleaner URLs. | ✓ |
| Single page with toggle | One /auth page with toggle between forms. | |

**User's choice:** Separate pages

| Option | Description | Selected |
|--------|-------------|----------|
| Email, password, first name, last name | Exactly what API requires. Minimal friction. | |
| Email, password, first name, last name, confirm password | Adds password confirmation to catch typos. | ✓ |

**User's choice:** Email, password, first name, last name, confirm password

## Protected Routes

| Option | Description | Selected |
|--------|-------------|----------|
| ProtectedRoute wrapper component | `<ProtectedRoute>` checks auth, renders children or Navigate to /login. | ✓ |
| Route-level loader functions | React Router clientLoader pattern. Requires framework mode. | |
| In-component auth check | Check auth store inside each page. Simplest but duplicates logic. | |

**User's choice:** ProtectedRoute wrapper component

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect back after login | Save attempted URL, redirect back after login. | ✓ |
| Always go to dashboard | Always send to /dashboard regardless of attempted URL. | |
| Query parameter for return path | Redirect with ?from=/dashboard in URL. | |

**User's choice:** Redirect back after login

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to dashboard | Authenticated users visiting /login or /register go to /dashboard. | ✓ |
| Show login anyway | Let authenticated users see auth forms. | |
| Show "already logged in" message | Friendly message with link to dashboard. | |

**User's choice:** Redirect to dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Loading state during rehydration | Spinner while Zustand persist rehydrates from localStorage. | ✓ |
| No loading state, just redirect | Accept brief flash of login page before redirect. | |
| App-level auth gate | Root-level auth check blocks rendering until store ready. | |

**User's choice:** Loading state during rehydration

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Inline field-level errors | Red error text below each specific field that failed. | ✓ |
| Form-level error banner | Single red banner at top showing all errors. | |
| Both inline and banner | Inline errors + summary banner at top. | |

**User's choice:** Inline field-level errors

| Option | Description | Selected |
|--------|-------------|----------|
| Generic network error message | "Unable to connect. Please check your connection and try again." | ✓ |
| Same banner with different text | Network errors use same display as API errors. | |
| Toast notification | Toast appears and disappears after a few seconds. | |

**User's choice:** Generic network error message

| Option | Description | Selected |
|--------|-------------|----------|
| Clear on field change | Errors clear when user starts typing again. | ✓ |
| Clear on next submit | Errors stay until user submits again. | |
| Manual dismiss only | User must manually dismiss errors. | |

**User's choice:** Clear on field change

| Option | Description | Selected |
|--------|-------------|----------|
| Button spinner + disabled | Submit button shows spinner and becomes disabled during API call. | ✓ |
| Full form overlay spinner | Overlay spinner blocks entire form during request. | |
| Just disabled button | Button disabled with no visual indicator. | |

**User's choice:** Button spinner + disabled

## Logout & Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Top navbar with greeting + logout | Header with "Hi, {firstName}" and logout button. | ✓ |
| Button at bottom of dashboard | Standalone logout button at bottom of dashboard. | |
| User dropdown menu | User menu in top-right corner with logout option. | |

**User's choice:** Top navbar with greeting + logout

| Option | Description | Selected |
|--------|-------------|----------|
| Clear store + redirect to login | Clear auth store and redirect to /login immediately. | ✓ |
| Show confirmation then redirect | Brief "Logged out" message before redirect. | |
| Stay on page, let ProtectedRoute redirect | Clear store, let route protection handle redirect. | |

**User's choice:** Clear store + redirect to login

| Option | Description | Selected |
|--------|-------------|----------|
| Top navbar only | Full-width content with top navbar. | |
| Navbar + empty sidebar space | Reserve space for sidebar now, populate in Phase 4. | ✓ |
| No navbar yet, just logout | Just logout button on dashboard, add navbar in Phase 4. | |

**User's choice:** Navbar + empty sidebar space

| Option | Description | Selected |
|--------|-------------|----------|
| "Hi, {firstName}" | Friendly greeting using firstName from auth store. | ✓ |
| Generic "Dashboard" title | Utilitarian, no personalization. | |
| "Welcome back, {fullName}" | Full name, more formal greeting. | |

**User's choice:** "Hi, {firstName}"

## the agent's Discretion

- Exact card styling (shadow intensity, border radius, padding)
- Loading spinner design (size, animation style)
- Exact error message wording beyond the network error template
- CSS transition timing for form state changes

## Deferred Ideas

None — discussion stayed within phase scope.
