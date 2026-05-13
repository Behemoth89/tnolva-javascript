---
status: diagnosed
phase: 02-authentication-ui
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-04-03T15:30:00+02:00
updated: 2026-04-03T16:00:00+02:00
---

## Current Test

[testing complete]

## Tests

### 1. Login Form — UI and Validation
expected: Navigating to `/login` shows a dark-themed centered card with email and password fields, labels, auto-focus on email, and a submit button. Submitting with empty fields shows inline validation errors on blur.
result: pass

### 2. Login Form — API Integration and Redirect
expected: Entering valid credentials and clicking submit calls `/api/auth/login`, stores tokens via Zustand, and redirects to `/dashboard`. Submit button shows spinner during request.
result: issue
reported: "Endpoints use /api/auth/login but TalTech API requires /api/v1/auth/login — missing v1 version prefix. All API calls return 404."
severity: blocker

### 6. Registration Form — API Integration and Redirect
expected: Filling valid registration data and submitting calls `/api/auth/register`, stores tokens via Zustand, and redirects to `/dashboard`. Submit button shows spinner during request.
result: issue
reported: "Same v1 version prefix missing — calls /api/auth/register instead of /api/v1/auth/register. Returns 404."
severity: blocker

### 3. Login Form — Error Handling
expected: Entering invalid credentials shows an error message above the form. Network errors show a general error message.
result: pass

### 4. PublicRoute — Redirect Authenticated Users
expected: If user is already authenticated (token in localStorage), navigating to `/login` or `/register` redirects to `/dashboard`.
result: pass

### 5. Registration Form — UI and Validation
expected: Navigating to `/register` shows a dark-themed card with 5 fields: Email, Password, Confirm Password, First Name, Last Name. Blur triggers validation (password match, required fields). Auto-focus on email.
result: pass

### 6. Registration Form — API Integration and Redirect
expected: Filling valid registration data and submitting calls `/api/auth/register`, stores tokens via Zustand, and redirects to `/dashboard`. Submit button shows spinner during request.
result: pass

### 7. Registration Form — Duplicate Email Error
expected: Registering with an existing email shows a "email already exists" error message.
result: pass

### 8. ProtectedRoute — Redirect Unauthenticated Users
expected: Navigating to `/dashboard` without being authenticated redirects to `/login` with return path saved. Shows a loading spinner during persist rehydration.
result: pass

### 9. ProtectedRoute — Allow Authenticated Users
expected: When authenticated (token in Zustand store), `/dashboard` renders the DashboardPage with navbar, sidebar space, and main content area.
result: pass

### 10. Navbar — User Greeting and Logout
expected: Dashboard shows navbar with "Hi, {firstName}" greeting and a logout button. Clicking logout clears auth state and redirects to `/login`.
result: pass

### 11. Dashboard Layout — Sidebar Reserved Space
expected: Dashboard layout includes an empty aside element (w-64) reserved for future sidebar content, preventing layout shift.
result: pass

### 12. Dark Theme Consistency
expected: All auth pages (login, register) and dashboard use consistent dark theme: zinc-950/900 backgrounds, amber-500 accent color, 44px min touch targets.
result: pass

## Summary

total: 12
passed: 10
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "API calls use versioned endpoints with correct paths matching TalTech Swagger spec"
  status: fixed
  reason: "Endpoints use /api/auth/login but TalTech API requires /api/v1/Account/Login — wrong path and missing version prefix"
  severity: blocker
  test: 2
  root_cause: "VITE_API_BASE_URL set to https://taltech.akaver.com without /api/v1 suffix. Endpoint paths used /api/auth/login instead of /Account/Login. RefreshToken endpoint used /api/auth/refresh instead of /Account/RefreshToken and sent wrong request body shape (missing jwt field, refreshTokenModel expects both jwt and refreshToken). Error response shape mismatch — API returns { messages: string[] } not { message: string }."
  artifacts:
    - path: ".env"
      issue: "VITE_API_BASE_URL missing /api/v1 suffix"
    - path: "src/lib/apiClient.ts"
      issue: "refresh endpoint used /api/auth/refresh instead of /Account/RefreshToken, request body missing jwt field, response destructured token instead of jwt"
    - path: "src/features/auth/pages/LoginPage.tsx"
      issue: "login endpoint used /api/auth/login instead of /Account/Login"
    - path: "src/features/auth/pages/RegisterPage.tsx"
      issue: "register endpoint used /api/auth/register instead of /Account/Register, error handler read data.message instead of data.messages[]"
    - path: "src/types/auth.ts"
      issue: "Missing RefreshTokenResponse type with jwt field"
  missing:
    - "Update .env VITE_API_BASE_URL to https://taltech.akaver.com/api/v1"
    - "Update login endpoint to /Account/Login"
    - "Update register endpoint to /Account/Register"
    - "Update refresh endpoint to /Account/RefreshToken with { jwt, refreshToken } body"
    - "Add RefreshTokenResponse type with jwt field"
    - "Update error handlers to read data.messages[] instead of data.message"
    - "Update duplicate email detection to check messages array for 'already' keyword (API returns 400 not 409)"
  debug_session: ""
