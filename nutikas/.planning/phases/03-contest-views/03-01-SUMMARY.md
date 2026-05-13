---
phase: 03-contest-views
plan: "01"
subsystem: api
tags: [pinia, axios, typescript, contest-api]

# Dependency graph
requires:
  - phase: 02-authentication
    provides: API client with JWT interceptors (src/api/index.ts)
provides:
  - Contest API fetch functions (getContests, getContest, getContestResults, getTeamDetail)
  - Pinia store for contest state (useContestStore)
  - TypeScript interfaces for contest DTOs
affects:
  - Phase 3 contest views
  - Phase 4 team registration
  - Phase 5 race participation

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pinia setup store pattern: defineStore('name', () => { ... })"
    - "API client module pattern: export async functions using shared api instance"

key-files:
  created:
    - src/types/contest.ts
    - src/api/contest.ts
    - src/stores/contest.ts
  modified: []

key-decisions:
  - "TeamResultDetail uses intersection type (TeamResultListItem & { markings }) rather than extending interface"
  - "All API endpoints are public — no auth token attachment needed"
  - "No Dexie persistence for contest store — public data refetched on each visit"
  - "checkPointType field typed as string to avoid Domain.ECheckPointType enum dependency"

patterns-established:
  - "API module pattern: single file per domain, named exports for each function"
  - "Store uses ref() for state, async functions for actions, error handling with descriptive messages"
  - "Types mirror API spec DTOs exactly (field names, nullable, types)"

requirements-completed:
  - CONT-01
  - CONT-02
  - CONT-03
  - CONT-04

# Metrics
duration: 5min
completed: 2026-05-13
---

# Phase 3 Plan 1: Contest API Layer and Pinia Store Summary

**Contest data fetching with typed API client and reactive Pinia store**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-13T19:25:00Z
- **Completed:** 2026-05-13T19:30:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created TypeScript interfaces for all contest DTOs matching api-spec.json
- Created API client with four fetch functions using shared api instance
- Created Pinia store with all required state and actions following auth.ts pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Create contest type definitions** - `c3b540a` (feat)
2. **Task 2: Create contest API client** - `c3b540a` (feat)
3. **Task 3: Create contest Pinia store** - `c3b540a` (feat)

**Plan metadata:** `c3b540a` (feat: implement contest API layer and Pinia store)

## Files Created/Modified
- `src/types/contest.ts` - TypeScript interfaces: ContestListItem, ContestDetails, ContestClassListItem, ContestResults, TeamResultListItem, TeamResultDetail, MarkingListItem
- `src/api/contest.ts` - API functions: getContests, getContest, getContestResults, getTeamDetail
- `src/stores/contest.ts` - Pinia store: useContestStore with contests, currentContest, currentResults, currentTeamDetail, loading, error state and async fetch actions

## Decisions Made
- Used `export type` for `TeamResultDetail` (intersection type) rather than `interface extends` since it adds the `markings` field to `TeamResultListItem`
- Typed `checkPointType` as `string` instead of importing `Domain.ECheckPointType` enum to avoid circular dependencies or missing type definitions
- No Dexie persistence needed — contest data is public and refetched on each view visit

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all three tasks completed without deviation.

## Next Phase Readiness
- Contest API layer complete and committed
- Ready for Phase 3 Plan 2: Contest List View
- All four CONT-xxx requirements satisfied by this plan

---
*Phase: 03-contest-views*
*Plan: 03-01*
*Completed: 2026-05-13*