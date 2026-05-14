---
phase: "05-race-participation"
plan: "04"
subsystem: ui
tags: [vue3, element-plus, race-scanner, qr-code, pinia]

# Dependency graph
requires:
  - phase: "05-01"
    provides: "Race types, marking API, race store, toast composable"
  - phase: "05-02"
    provides: "RaceScanner component with QR scanning, manual entry"
  - phase: "05-03"
    provides: "ScoreCard, TeamInfoCard components"
provides:
  - "RaceScorePanel component with collapsible post-race breakdown"
  - "RaceView combined screen with pre/active/post state machine"
  - "/race/:contestId/:userTeamId route with authentication"
affects: [06-offline-support]

# Tech tracking
tech-stack:
  added: [element-plus]
  patterns:
    - "Three-phase state machine (pre/active/post) for race lifecycle"
    - "Collapsible breakdown using ElCollapse component"
    - "Two-panel layout (score + scanner) with mobile-first responsive design"

key-files:
  created:
    - "src/components/RaceScorePanel.vue"
    - "src/views/RaceView.vue"
  modified:
    - "src/router/index.ts"

key-decisions:
  - "Used ElCollapse/ElCollapseItem for collapsible score breakdown (per D-14)"
  - "Race phase derived from raceState: pre (startDT=null), active (startDT!=null && finishDT=null), post (finishDT!=null)"
  - "Two-panel layout: score panel (sticky on desktop) + scanner panel"
  - "provideToast() called at RaceView level for toast access"

patterns-established:
  - "RaceView as top-level screen providing toast context to all child components"
  - "Mobile-first: stacked vertically on small screens, side-by-side on desktop (769px breakpoint)"

requirements-completed:
  - "RACE-01"
  - "RACE-02"
  - "RACE-03"
  - "RACE-04"
  - "RACE-05"
  - "RACE-06"
  - "RACE-07"
  - "SCAN-01"
  - "SCAN-02"
  - "SCAN-03"
  - "SCAN-04"
  - "SCAN-05"

# Metrics
duration: 30min
completed: 2026-05-14
---

# Phase 5 Plan 4: Race Score Panel and Combined Race View Summary

**RaceScorePanel with collapsible breakdown and RaceView with pre/active/post state machine wired together**

## Performance

- **Duration:** 30 min
- **Started:** 2026-05-14T10:00:06Z
- **Completed:** 2026-05-14T10:29:39Z
- **Tasks:** 4 (3 auto + 1 human-verify checkpoint)
- **Files modified:** 3 created, 1 modified

## Accomplishments

- RaceScorePanel shows final score as hero element with collapsible sections for Score/Bonus/Penalty/Time
- RaceView handles three-phase state transitions: pre-race (team info + scanner) → active (live score + scanner) → post-race (final breakdown + scanner)
- Router has `/race/:contestId/:userTeamId` route with `requiresAuth: true`
- Human verification passed: Docker build successful, container healthy at port 3000

## Task Commits

Each task was committed atomically:

1. **Task 1: RaceScorePanel with collapsible breakdown** - `44cb9d5` (feat)
2. **Task 2: RaceView combined screen** - `fa7a874` (feat)
3. **Task 3: Add race route to router** - `5dfc470` (feat)

## Files Created/Modified

- `src/components/RaceScorePanel.vue` - Collapsible post-race score breakdown with hero final score, ElCollapse sections for Score/Bonus/Penalty/Time, green for bonus, red for penalty
- `src/views/RaceView.vue` - Combined race participation screen with three-phase state machine, two-panel layout (score + scanner), provides toast context
- `src/router/index.ts` - Added `/race/:contestId/:userTeamId` route with `requiresAuth: true`

## Decisions Made

- Used Element Plus `ElCollapse`/`ElCollapseItem` for collapsible breakdown per D-14 spec
- Race phase derived from raceState: `pre` (startDT=null), `active` (startDT!=null && finishDT=null), `post` (finishDT!=null)
- Two-panel layout with score panel sticky on desktop (769px breakpoint)
- `provideToast()` called at RaceView level so all child components can use useToast()

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript errors were fixed prior to human verification, Docker build passed cleanly.

## Human Verification

**Verification passed:** Human rebuilt and ran the app in Docker. Container is healthy at port 3000.

Steps verified:
1. Navigated to `/race/{contestId}/{userTeamId}` (requires auth)
2. Pre-race state shows TeamInfoCard + scanner preview
3. Active race shows scanner + live score simultaneously
4. Post-race shows final score with collapsible breakdown
5. Docker build completed successfully

## Next Phase Readiness

Ready for Phase 06 (Offline Support). The race participation flow is complete with:
- QR scanning with Estonian character support
- Live score updates with position tracking
- Post-race breakdown with elapsed time
- Offline marking queue infrastructure from 05-01

---
*Phase: 05-race-participation*
*Plan: 04*
*Completed: 2026-05-14*