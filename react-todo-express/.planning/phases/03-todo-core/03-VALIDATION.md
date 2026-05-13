---
phase: 03
slug: todo-core
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 03 — Validation Strategy

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
| 03-01-01 | 01 | 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, CAT-01, CAT-02, CAT-03, PRI-01, PRI-02, PRI-03, INF-04, INF-05 | unit | `npm test -- types.test.ts` | ✅ | ✅ green |
| 03-01-02 | 01 | 1 | CAT-01, CAT-02, CAT-03, PRI-01, PRI-02, PRI-03 | unit | `npm test -- types.test.ts` | ✅ | ✅ green |
| 03-02-01 | 02 | 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, INF-04, INF-05 | unit | `npm test -- stores.test.ts` | ✅ | ✅ green |
| 03-02-02 | 02 | 1 | CAT-01, CAT-02, CAT-03, PRI-01, PRI-02, PRI-03, INF-04, INF-05 | unit | `npm test -- stores.test.ts` | ✅ | ✅ green |
| 03-03-01 | 03 | 2 | TASK-01, TASK-03, TASK-04, TASK-05 | component | `npm test -- components.test.tsx` | ✅ | ✅ green |
| 03-03-02 | 03 | 2 | TASK-02, TASK-03, INF-04 | component | `npm test -- components.test.tsx` | ✅ | ✅ green |
| 03-03-03 | 03 | 2 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, INF-04, INF-05 | integration | `npm test -- components.test.tsx` | ✅ | ✅ green |
| 03-04-01 | 04 | 2 | CAT-01, CAT-02, CAT-03 | component | `npm test -- settings.test.tsx` | ✅ | ✅ green |
| 03-04-01 | 04 | 2 | PRI-01, PRI-02, PRI-03 | component | `npm test -- settings.test.tsx` | ✅ | ✅ green |
| 03-04-02 | 04 | 2 | CAT-01, CAT-02, CAT-03, PRI-01, PRI-02, PRI-03, INF-04, INF-05 | component | `npm test -- settings.test.tsx` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/__tests__/types.test.ts` — type contract tests for Task, Category, Priority
- [x] `src/__tests__/stores.test.ts` — Zustand store behavior tests with mocked apiClient
- [x] `src/__tests__/components.test.tsx` — TaskCard, TaskList, TaskModal component tests
- [x] `src/__tests__/settings.test.tsx` — CategoryManager, PriorityManager, SettingsPage tests
- [x] `src/__tests__/setup.ts` — jest-dom vitest setup
- [x] `vitest.config.ts` — vitest configuration with jsdom environment
- [x] vitest, @testing-library/react, @testing-library/jest-dom, jsdom installed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full task CRUD end-to-end via API | TASK-01..05 | Requires live TalTech API connection | 1. Login 2. Create task 3. Edit task 4. Delete task 5. Verify in UI |
| Category CRUD end-to-end via API | CAT-01..03 | Requires live TalTech API connection | 1. Go to Settings 2. Add category 3. Edit 4. Delete 5. Verify in task dropdown |
| Priority CRUD end-to-end via API | PRI-01..03 | Requires live TalTech API connection | 1. Go to Settings 2. Add priority 3. Edit 4. Delete 5. Verify in task dropdown |
| Loading spinner visual appearance | INF-04 | Visual verification | Trigger slow API call, verify amber-500 ring spinner appears |
| Error banner visual appearance | INF-05 | Visual verification | Trigger API failure, verify red-500/10 error banner appears |

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
| Gaps found | 14 |
| Resolved | 14 |
| Escalated | 0 |

**Tests created:** 61 tests across 4 test files
**Test infrastructure:** vitest 4.1.2 + @testing-library/react + jsdom
**All tests passing:** ✅
