---
phase: "04-team-registration"
plan: "02"
subsystem: team-registration-ui
tags: [registration-modal, my-teams-view, router, element-plus]
dependency_graph:
  requires: [team-types, team-api-client, team-store, dexie-active-team]
  provides: [registration-modal, my-teams-view, my-teams-route]
  affects: [contest-detail-view]
tech_stack:
  added: [Vue 3 component, Element Plus notifications, Pinia composable, Vue Router dynamic route]
  patterns: [modal overlay pattern, expandable list item pattern, active team selection]
key_files:
  created:
    - src/views/MyTeamsView.vue
    - src/components/RegistrationModal.vue
  modified:
    - src/router/index.ts
    - src/main.ts
decisions:
  - Used Element Plus for toast notifications (ElMessage.success/error)
  - RegistrationModal is a controlled component with show prop and close emit
  - MyTeamsView expands teams inline with toggleExpand pattern
  - Active team indicated by matching teamStore.activeTeam?.teamId
metrics:
  duration: "~8 minutes"
  completed: "2026-05-13T23:43:00Z"
  tasks: 3
  files: 5
---

# Phase 04 Plan 02 Summary: Team Registration UI

## One-liner

Registration modal with form validation, My Teams view with expandable team list, and /contests/:id/my-teams route.

## What Was Built

### Task 1: My Teams Route (`src/router/index.ts`)
Added `/contests/:id/my-teams` route pointing to `MyTeamsView.vue`:
- NOT guestOnly (requires authentication via existing beforeEach guard)
- Placed after `contest-detail` route entry

### Task 2: RegistrationModal Component (`src/components/RegistrationModal.vue`)
Modal overlay with team registration form:
- Props: `show: boolean`, `contestId: string`, `contestClasses: ContestClass[]`
- Emits: `close` event
- Form fields: teamName (text), teamMembers (text), contestClassId (radio buttons)
- Radio buttons display class name + formatted duration for each class
- Inline validation with error messages below each field
- `handleSubmit`: validates → calls `registerTeam()` → shows `ElMessage.success()` on success
- `close()`: resets form and errors, emits 'close'
- Backdrop click (`@click.self`) closes modal
- Added Element Plus dependency and registered in main.ts

### Task 3: MyTeamsView Component (`src/views/MyTeamsView.vue`)
Page displaying user's teams with expandable details:
- Header with "My Teams" title and back button to contest detail
- Loads `teamStore.loadActiveTeam()` and `teamStore.fetchMyTeams(contestId)` on mount
- Loading state: shows spinner when `teamStore.loading`
- Error state: shows error message with retry button
- Empty state: "No teams yet" with link back to contest detail
- Team list: `v-for="team in teamStore.myTeams"` with click to expand
- Team row shows: teamName, contestClassName, finalScore (if available), "Active" badge if active
- Expandable detail shows: memberNames, startDT, finishDT, finalScore
- "Set as Active" button (if not already active) calls `teamStore.setActiveTeam(team)`
- `toggleExpand(id)`: sets `expandedId` to id if not already expanded, otherwise null
- `isActive(team)`: returns true if `teamStore.activeTeam?.teamId === team.teamId`
- `formatDateTime(dt)`: converts ISO string to local datetime string

## Verification

- TypeScript build: `vue-tsc -b && vite build` — **PASSED** (0 errors)
- `/contests/:id/my-teams` route verified in router
- `v-for="cls in contestClasses"` verified in RegistrationModal
- `ElMessage.success` verified in RegistrationModal
- `v-for="team in teamStore.myTeams"` verified in MyTeamsView
- "Set as Active" button verified in MyTeamsView
- `toggleExpand` function verified in MyTeamsView

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 28d0c75 | feat(04-02): add My Teams route to router |
| 2 | 8f8309c | feat(04-02): create RegistrationModal component with form validation |
| 3 | d3941ba | feat(04-02): create MyTeamsView component |

## Deviations from Plan

**None** — plan executed exactly as written.

## Known Stubs

None — all functionality wired with real API calls and store actions.

## Threat Flags

None — form validation, store actions, and UI rendering only. No new attack surface.

## Self-Check: PASSED

- [x] `src/router/index.ts` — my-teams route verified
- [x] `src/components/RegistrationModal.vue` — modal with validation and toast verified
- [x] `src/views/MyTeamsView.vue` — team list with expand and active selection verified
- [x] `src/main.ts` — Element Plus registered
- [x] Build passes with 0 TypeScript errors