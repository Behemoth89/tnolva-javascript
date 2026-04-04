---
phase: 04
slug: settings-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (detected in project) |
| **Config file** | `vitest.config.ts` — Wave 0 verifies/creates |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | TASK-06 | unit | `npx vitest run sidebar` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | TASK-06 | unit | `npx vitest run sidebar` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | TASK-07 | unit | `npx vitest run taskcard` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | TASK-07 | unit | `npx vitest run taskcard` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | SET-01 | unit | `npx vitest run emptystate` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | SET-02 | unit | `npx vitest run emptystate` | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 2 | SET-03 | unit | `npx vitest run emptystate` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | INF-06 | integration | `npx vitest run navbar` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 3 | TASK-06 | unit | `npx vitest run filtering` | ❌ W0 | ⬜ pending |
| 04-05-02 | 05 | 3 | TASK-06 | unit | `npx vitest run filtering` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/sidebar.test.tsx` — Sidebar rendering, category checkboxes, filter state
- [ ] `src/__tests__/taskcard-priority.test.tsx` — Priority icon rendering, tooltip behavior
- [ ] `src/__tests__/emptystate.test.tsx` — EmptyState component variants
- [ ] `src/__tests__/navbar-home.test.tsx` — Home link presence and navigation
- [ ] `src/__tests__/filtering.test.tsx` — Task filtering logic (category, date, completed)
- [ ] Existing vitest infrastructure covers all phase requirements

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Category filter persists across reload | TASK-06 | localStorage state verification | Select categories, reload page, verify selections remain |
| Priority icon tooltip shows on hover | TASK-07 | Visual interaction | Hover over priority icon, verify tooltip appears |
| Completed tasks sort to bottom | TASK-06 | Visual ordering | Mark task complete, verify it moves to bottom of list |
| Due date range filter works correctly | TASK-06 | Date calculation verification | Set date range, verify only matching tasks shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
