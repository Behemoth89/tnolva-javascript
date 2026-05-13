---
phase: 02
slug: authentication-ui
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-02, AUTH-08 | component | `npm test` | ✅ | ✅ green |
| 02-02-01 | 02 | 1 | AUTH-01 | component | `npm test` | ✅ | ✅ green |
| 02-03-01 | 03 | 2 | AUTH-06 | unit | `npm test` | ✅ | ✅ green |
| 02-03-02 | 03 | 2 | AUTH-07 | component | `npm test` | ✅ | ✅ green |
| 02-03-03 | 03 | 2 | AUTH-03 | component | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/__tests__/all-tests.test.tsx` — consolidated test file for all phases
- [x] `src/__tests__/setup.ts` — jest-dom vitest setup with axios mock
- [x] vitest, @testing-library/react, @testing-library/jest-dom, jsdom installed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full login flow with live API | AUTH-02 | Requires live TalTech API | 1. Visit /login 2. Enter credentials 3. Submit 4. Verify redirect to /dashboard |
| Full registration flow with live API | AUTH-01 | Requires live TalTech API | 1. Visit /register 2. Fill form 3. Submit 4. Verify redirect to /dashboard |
| Session persistence across page reload | AUTH-06 | Requires browser reload | 1. Login 2. Reload page 3. Verify still authenticated |
| Logout from any authenticated page | AUTH-03 | Requires manual interaction | 1. Login 2. Click Logout 3. Verify redirect to /login |
| Authenticated user redirect from /login | AUTH-08 | Requires browser navigation | 1. Login 2. Navigate to /login 3. Verify redirect to /dashboard |
| Unauthenticated redirect from /dashboard | AUTH-07 | Requires browser navigation | 1. Clear auth 2. Navigate to /dashboard 3. Verify redirect to /login |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 3s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-03

---

## Validation Audit 2026-04-03

| Metric | Count |
|--------|-------|
| Gaps found | 8 |
| Resolved | 8 |
| Escalated | 0 |

**Tests covering Phase 02:** 26 tests in `all-tests.test.tsx`
- LoginPage rendering, validation, error handling (7 tests)
- RegisterPage rendering, validation, error handling (6 tests)
- PublicRoute redirect behavior (2 tests)
- ProtectedRoute redirect and loading behavior (3 tests)
- Navbar greeting and logout (3 tests)
- Auth store setAuth/clearAuth/persistence (3 tests)
- API client interceptor (1 test)
- Auth type shapes (1 test)
