---
phase: 04-settings-integration
plan: 02
subsystem: ui
tags: [heroicons, taskcard, navbar, react, tailwind]

# Dependency graph
requires:
  - phase: 03-todo-core
    provides: TaskCard component with priority badge
provides:
  - Priority icon display with tooltip on TaskCard
  - Home navigation link in Navbar
affects: [verification, ui-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [icon-only priority display, native title tooltips, icon-only nav links with aria-labels]

key-files:
  created: []
  modified:
    - src/features/dashboard/components/TaskCard.tsx
    - src/components/Navbar.tsx

key-decisions:
  - "Used native title attribute for tooltip instead of custom tooltip component — zero dependencies, accessible"
  - "Priority color mapping via getPriorityColor helper — sorts by prioritySort, maps index to red/amber/green"

patterns-established:
  - "Priority as icon with hover tooltip — replaces text badges"
  - "Icon-only nav links with aria-label for accessibility"

requirements-completed: [TASK-07, INF-06]

# Metrics
duration: 2min
completed: 2026-04-04
---

# Phase 04 Plan 02: Priority Icon and Home Link Summary

**Replace priority text badge with FlagIcon and add Home navigation link to Navbar**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-04T08:43:00Z
- **Completed:** 2026-04-04T08:45:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- TaskCard now shows FlagIcon instead of text badge for priority, with native tooltip on hover
- Priority colors mapped dynamically by prioritySort order (red=lowest, amber=middle, green=highest)
- Navbar has HomeIcon link to "/" positioned before Settings link with aria-label for accessibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace priority text badge with FlagIcon and tooltip** - `6b14308` (feat)
2. **Task 2: Add Home link to Navbar** - `d4bec32` (feat)

## Files Created/Modified
- `src/features/dashboard/components/TaskCard.tsx` - FlagIcon import, getPriorityColor helper, replaced text badge with icon + tooltip
- `src/components/Navbar.tsx` - HomeIcon import, added Home Link before Settings link

## Decisions Made
- Used native `title` attribute for tooltip instead of a custom tooltip library — zero dependencies, accessible, follows KISS principle
- Priority color mapping uses a helper function that sorts all priorities by `prioritySort` and maps index position to colors — handles any number of priorities, not just 3

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Priority icon display complete, ready for visual verification
- Home link enables navigation back to dashboard from settings page
- TypeScript compiles cleanly with no errors

---
*Phase: 04-settings-integration*
*Completed: 2026-04-04*
