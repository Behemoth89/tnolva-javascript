---
phase: "04-team-registration"
plan: "01"
subsystem: team-registration-backend
tags: [team, api, store, indexeddb, types]
dependency_graph:
  requires: []
  provides: [team-types, team-api-client, team-store, dexie-active-team]
  affects: [team-registration-ui, contest-views]
tech_stack:
  added: [TypeScript interfaces, Pinia composable store, Dexie schema extension]
  patterns: [composable store pattern, IndexedDB persistence, API client with JWT interceptors]
key_files:
  created:
    - src/types/team.ts
    - src/api/team.ts
    - src/stores/team.ts
  modified:
    - src/db/index.ts
decisions:
  - Used ActiveTeamRecord.id = 'current' constant to always store exactly one active team
  - Dexie version 2 added with activeTeam table, preserving version 1 auth table
  - ActiveTeamRecord uses team.teamId from UserTeamListItem as primary team identifier
metrics:
  duration: "~5 minutes"
  completed: "2026-05-13T23:35:32Z"
  tasks: 4
  files: 4
---

# Phase 04 Plan 01 Summary: Team Registration Core

## One-liner

Team registration types, API client functions, Pinia team store, and IndexedDB activeTeam table for persistent team state.

## What Was Built

### Task 1: TypeScript Types (`src/types/team.ts`)
Four exported interfaces matching API spec DTOs:
- `TeamRegistrationRequest` — `{ teamName, teamMembers, contestClassId }`
- `UserTeamListItem` — full team list item with nullable fields per spec
- `UserTeamActivation` — team detail with score breakdown and markings
- `ActiveTeamRecord` — IndexedDB storage format with constant `id: 'current'`

### Task 2: Team API Client (`src/api/team.ts`)
Three async functions using pre-configured `api` instance with JWT interceptors:
- `registerTeam(contestId, request)` → POST `/Contests/{contestId}/teams`
- `getUserTeams(contestId)` → GET `/Contests/{contestId}/userteams`
- `getUserTeamActivation(teamId)` → GET `/UserTeams/{teamId}`

### Task 3: Dexie Schema Extension (`src/db/index.ts`)
Added `activeTeam` table at version 2:
- `activeTeam!: Table<ActiveTeamRecord>` class property
- `this.version(2).stores({ activeTeam: 'id' })` declaration
- Maintains backward compatibility with existing `auth` table at version 1

### Task 4: Pinia Team Store (`src/stores/team.ts`)
Composable store following exact same pattern as `useAuthStore` and `useContestStore`:
- State: `myTeams`, `activeTeam`, `currentTeamDetail`, `loading`, `error`
- `loadActiveTeam()` — reads from IndexedDB, sets `activeTeam.value`
- `setActiveTeam(team)` — writes `ActiveTeamRecord` with `id: 'current'`
- `clearActiveTeam()` — deletes from IndexedDB, sets `activeTeam` to null
- `fetchMyTeams(contestId)` — calls `teamApi.getUserTeams`
- `fetchTeamDetail(teamId)` — calls `teamApi.getUserTeamActivation`

## Verification

- TypeScript build: `vue-tsc -b && vite build` — **PASSED** (0 errors)
- All 4 exported interfaces present in `src/types/team.ts`
- All 3 API functions present in `src/api/team.ts`
- `version(2)` and `activeTeam: 'id'` present in `src/db/index.ts`
- All 5 store functions present in `src/stores/team.ts`

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 603c1b9 | feat(04-01): add team type definitions |
| 2 | 0659092 | feat(04-01): create team API client functions |
| 3 | 2433b0a | feat(04-01): extend Dexie schema with activeTeam table |
| 4 | 34bc296 | feat(04-01): create Pinia team store |

## Deviations from Plan

**None** — plan executed exactly as written.

## Threat Flags

None — pure data types, API client, and client-side state management. No network attack surface introduced.

## Self-Check: PASSED

- [x] `src/types/team.ts` — 4 exported interfaces verified
- [x] `src/api/team.ts` — 3 functions verified
- [x] `src/db/index.ts` — version(2) and activeTeam table verified
- [x] `src/stores/team.ts` — useTeamStore with 5 actions verified
- [x] Build passes with 0 TypeScript errors