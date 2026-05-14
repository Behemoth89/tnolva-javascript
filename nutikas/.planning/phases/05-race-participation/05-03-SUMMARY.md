---
phase: "05-race-participation"
plan: "03"
subsystem: "components"
tags:
  - "vue-3"
  - "race-view"
  - "score-display"
  - "team-info"
requires:
  - "RACE-04"
  - "RACE-05"
  - "RACE-06"
provides:
  - "TeamInfoCard.vue"
  - "ScoreCard.vue"
affects:
  - "src/components"
tech_stack:
  added:
    - "he type declarations (src/types/he.d.ts)"
  patterns:
    - "computePosition for ordinal calculation from results array"
    - "toOrdinal helper for 1st/2nd/3rd formatting"
    - "refresh event emit pattern for manual score refresh"
key_files:
  created:
    - "src/components/TeamInfoCard.vue"
    - "src/components/ScoreCard.vue"
    - "src/types/he.d.ts"
  modified:
    - "src/api/marking.ts"
    - "src/types/race.ts"
key_decisions:
  - "ScoreCard receives position as prop (computed by parent from API results) rather than fetching directly"
  - "computePosition exported from ScoreCard for parent component reuse"
  - "Added @types/he declaration file to fix TypeScript compilation error for 'he' module"
requirements_completed:
  - "RACE-04"
  - "RACE-05"
  - "RACE-06"
duration: "8 min"
completed: "2026-05-14T09:49:00Z"
---

# Phase 05 Plan 03: ScoreCard and TeamInfoCard Components Summary

## What Was Built

Built two Vue 3 SFC components for the race participation UI:

1. **TeamInfoCard** (`src/components/TeamInfoCard.vue`) — Displays team name, class name, and member names in a compact card layout using existing card styling patterns from RegistrationModal.vue.

2. **ScoreCard** (`src/components/ScoreCard.vue`) — Displays score breakdown with finalScore as hero element, position as ordinal within class (e.g., "3rd of 12"), and emits refresh event for manual score refresh per D-08.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | `14327c7` | feat(05-race-participation): add TeamInfoCard component |
| 2 | `cc5998e` | feat(05-race-participation): add ScoreCard component |

## Files Created/Modified

**Created:**
- `src/components/TeamInfoCard.vue` — Team info display card
- `src/components/ScoreCard.vue` — Score display with position
- `src/types/he.d.ts` — Type declarations for `he` module (fixes TS6196)

**Modified:**
- `src/api/marking.ts` — Removed unused `MarkingRequest` import
- `src/types/race.ts` — Removed unused `MarkingListItem` import

## Key Implementation Details

### TeamInfoCard
- Props: `teamName`, `contestClassName`, `memberNames` (comma-separated string)
- Displays team name as card title, class as badge, members as formatted list
- Uses existing card styling pattern (shadow, rounded corners)

### ScoreCard
- Props: `score`, `bonus`, `penalty`, `finalScore`, `position` (ordinal+total), `contestId`, `userTeamId`, `contestClassId`, `isLoading`
- Emits: `refresh` event for manual score refresh (D-08)
- Color-coded breakdown: green for bonus, red for penalty
- Position displayed as ordinal word when available, "--" when null
- `computePosition` function exported for parent component reuse
- `toOrdinal` helper converts numeric position to ordinal words (1st, 2nd, 3rd, etc.)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript compilation errors**
- **Found during:** Verification
- **Issue:** Build failed with TS6133 (unused imports) and TS7016 (missing type declaration for `he`)
- **Fix:** Removed unused imports from `marking.ts` and `race.ts`, added `src/types/he.d.ts` declaration file
- **Files modified:** `src/api/marking.ts`, `src/types/race.ts`, `src/types/he.d.ts`
- **Verification:** `npm run build` passes
- **Commit:** `cc5998e` (amended)

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| TeamInfoCard displays team name, class, members in a compact card | ✓ PASS |
| ScoreCard displays finalScore as hero element with score breakdown | ✓ PASS |
| Position shown as ordinal within class (e.g., "3rd of 12") only when data is available | ✓ PASS |
| ScoreCard emits refresh event for manual score refresh (D-08) | ✓ PASS |
| All TypeScript compiles without errors | ✓ PASS |

## Self-Check

- [x] `src/components/TeamInfoCard.vue` exists on disk
- [x] `src/components/ScoreCard.vue` exists on disk
- [x] `src/types/he.d.ts` exists on disk
- [x] Commit `14327c7` found in git log (TeamInfoCard)
- [x] Commit `cc5998e` found in git log (ScoreCard)
- [x] Build passes with no TypeScript errors

## Self-Check: PASSED

---

*Created by GSD executor for phase 05-race-participation plan 03*