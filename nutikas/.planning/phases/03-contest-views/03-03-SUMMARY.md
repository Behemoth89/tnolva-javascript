---
phase: "03"
plan: "03"
subsystem: "contest-views"
tags:
  - contest
  - view
  - router
  - contest-detail
dependency_graph:
  requires: []
  provides:
    - path: "src/views/ContestDetailView.vue"
      description: "Contest detail page component"
    - path: "src/router/index.ts"
      exports:
        - "/contests/:id route"
        - "/contests/:id/results route"
  affects: []
tech_stack:
  added:
    - vue
    - vue-router
    - pinia
  patterns:
    - "Vue 3 Composition API with script setup"
    - "Pinia store integration"
    - "Router push navigation"
key_files:
  created:
    - path: "src/views/ContestDetailView.vue"
      description: "Contest detail page with header, classes list, and action buttons"
  modified:
    - path: "src/router/index.ts"
      description: "Added contest-detail and contest-results routes"
decisions: []
metrics:
  duration: ""
  completed: "2026-05-13T19:25:43Z"
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 03 Plan 03: Contest Detail View Summary

## One-liner

Contest detail view with header, sorted class list, and Register/Results navigation links.

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create ContestDetailView.vue | aa3386c | src/views/ContestDetailView.vue |
| 2 | Add contest routes to router | aa3386c | src/router/index.ts |

## Task Details

### Task 1: Create ContestDetailView.vue

**Commit:** `aa3386c`

Created `src/views/ContestDetailView.vue` with:
- **Contest Header:** Displays contest name and dates (openFrom → openTo)
- **Classes Section:** Lists contest classes sorted by `orderNr` with duration formatting (e.g., "2h 30m")
- **Action Links:**
  - "Register" button when `isOpenForParticipation` is true → navigates to `/contests/${id}/register`
  - "View Results" button when `hasResults` is true → navigates to `/contests/${id}/results`
  - Empty state message when neither is available
- **Error Handling:** Loading state, error state with retry, empty state for missing contest
- **Mobile-first:** Responsive layout with clear tap targets

**Key implementation:**
- Uses `useContestStore().fetchContest(id)` on mount
- Computed `contestClasses` sorted by `orderNr`
- Navigation via `router.push()` for register and results links

### Task 2: Add /contests/:id route to router

**Commit:** `aa3386c`

Added to `src/router/index.ts`:
- `/contests/:id/results` route (name: `contest-results`) — placed **before** `/contests/:id` for specificity
- `/contests/:id` route (name: `contest-detail`)

Both routes have `meta: { guestOnly: false }` (public, no auth required).

## Verification Results

| Check | Command | Result |
| ----- | ------- | ------ |
| File exists | `Test-Path src/views/ContestDetailView.vue` | True |
| router.push | `Select-String contestClasses` in vue file | 4 occurrences |
| orderNr sorting | `Select-String orderNr` in vue file | 2 occurrences |
| contest-detail route | `Select-String contest-detail` in router | 1 occurrence |
| contest-results route | `Select-String contest-results` in router | 1 occurrence |

## Success Criteria Status

| Criterion | Status |
| ---------- | ------ |
| Contest header shows name and dates (CONT-02) | ✅ |
| Contest classes listed sorted by orderNr with duration displayed (CONT-02) | ✅ |
| "Register" link shown when isOpenForParticipation is true | ✅ |
| "View Results" link shown when results available | ✅ |
| Works without login (public route) | ✅ |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check

**Created files exist:**
- `src/views/ContestDetailView.vue` — FOUND
- `src/router/index.ts` — FOUND (modified, committed in aa3386c)

**Commits exist:**
- `aa3386c` — FOUND

## TDD Gate Compliance

Not applicable (plan type is `execute`, not `tdd`).

---

*Plan 03-03 complete. Ready for verifier to validate implementation.*