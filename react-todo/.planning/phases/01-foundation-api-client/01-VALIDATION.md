---
phase: 01
slug: foundation-api-client
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 01 — Validation Strategy

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
| 01-01-01 | 01 | 1 | INF-01, INF-02 | unit | `npm test` | ✅ | ✅ green |
| 01-02-01 | 02 | 2 | AUTH-04, AUTH-05 | unit | `npm test` | ✅ | ✅ green |
| 01-02-02 | 02 | 2 | AUTH-04, AUTH-05 | unit | `npm test` | ✅ | ✅ green |
| 01-03-01 | 03 | 2 | AUTH-04, AUTH-05 | unit | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/__tests__/all-tests.test.tsx` — consolidated test file for all phases
- [x] `src/__tests__/setup.ts` — jest-dom vitest setup with axios mock
- [x] `vitest.config.ts` — vitest configuration with jsdom environment
- [x] vitest, @testing-library/react, @testing-library/jest-dom, jsdom installed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vite dev server starts and serves app | INF-01 | Requires running dev server | Run `npm run dev`, verify app loads at localhost:5173 |
| Tailwind CSS classes render styled elements | INF-01 | Visual verification | Check that styled elements appear with correct colors/spacing |
| React Router navigates between pages | INF-02 | Requires browser navigation | Click links, verify URL changes and correct pages render |
| Token auto-attach on live API requests | AUTH-04 | Requires live TalTech API | Login, make API call, verify Authorization header in network tab |
| Token refresh on 401 response | AUTH-05 | Requires expired token scenario | Wait for token expiry, make API call, verify automatic refresh |

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
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |

**Tests covering Phase 01:** 8 tests in `all-tests.test.tsx`
- Auth type shape validation (4 tests)
- API client singleton verification (1 test)
- Auth store setAuth/clearAuth/persistence (3 tests)
