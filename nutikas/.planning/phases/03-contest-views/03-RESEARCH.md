# Phase 3: Contest Views — Research

**Researched:** 2026-05-13
**Status:** Ready for planning
**Source:** /gsd-plan-phase phase-3 research

---

## Domain Overview

Phase 3 delivers public contest browsing, details viewing, results viewing, and team detail viewing — all accessible without authentication. This is the first phase that exposes unauthenticated public data, requiring no JWT tokens.

**Key constraint:** All views must work without login (per CONT-01: "browse visible contests without logging in").

---

## API Endpoints

### 1. Contest List
```
GET /api/v1/Contests
Response: ContestListItem[]
```

### 2. Contest Details
```
GET /api/v1/Contests/{id}
Response: ContestDetails
  - id: uuid
  - name: string | null
  - openFrom: datetime
  - openTo: datetime
  - contestClasses: ContestClassListItem[]
```

### 3. Contest Results
```
GET /api/v1/Contests/{id}/results
Response: ContestResults
  - contest: ContestListItem
  - teams: TeamResultListItem[] | null
```

### 4. Team Detail
```
GET /api/v1/Contests/{contestId}/teams/{teamId}
Response: TeamResultDetail
```

---

## DTO Schemas

### ContestListItem
```typescript
{
  id: string (uuid)
  name: string | null
  visibleFrom: datetime
  openFrom: datetime
  openTo: datetime
  isOpenForParticipation: boolean
  hasResults: boolean
}
```

### ContestDetails
```typescript
{
  id: string (uuid)
  name: string | null
  openFrom: datetime
  openTo: datetime
  contestClasses: ContestClassListItem[] | null
}
```

### ContestClassListItem
```typescript
{
  id: string (uuid)
  name: string | null
  orderNr: integer
  duration: integer
  maxDuration: integer | null
}
```

### ContestResults
```typescript
{
  contest: ContestListItem
  teams: TeamResultListItem[] | null
}
```

### TeamResultListItem
```typescript
{
  id: string (uuid)
  name: string | null
  memberNames: string | null
  contestClassId: string (uuid)
  contestClassName: string | null
  contestClassOrderNr: integer
  startDT: datetime | null
  finishDT: datetime | null
  score: integer
  bonus: integer
  penalty: integer
  finalScore: integer
}
```

### TeamResultDetail
```typescript
{
  id: string (uuid)
  name: string | null
  memberNames: string | null
  contestClassId: string (uuid)
  contestClassName: string | null
  contestClassOrderNr: integer
  startDT: datetime | null
  finishDT: datetime | null
  score: integer
  bonus: integer
  penalty: integer
  finalScore: integer
  markings: MarkingListItem[] | null
}
```

### MarkingListItem
```typescript
{
  id: string (uuid)
  dt: datetime
  checkPointId: string (uuid)
  checkPointCPID: string | null
  checkPointCPCode: string | null
  checkPointType: Domain.ECheckPointType
  score: integer
  lat: string | null
  lon: string | null
}
```

---

## Implementation Patterns

### 1. Pinia Store (contest.ts)

Following the `src/stores/auth.ts` pattern:
- Define store with `defineStore('contest', () => { ... })`
- State: `contests`, `currentContest`, `currentResults`, `currentTeamDetail`
- No Dexie persistence needed (public data, refetch on visit)
- Fetch methods calling `api.get('/contests')`, `api.get('/contests/${id}')`, etc.

### 2. API Client (contestApi.ts)

New file in `src/api/`:
```typescript
import { api } from '@/api'

export const contestApi = {
  getContests() { return api.get('/Contests') },
  getContest(id: string) { return api.get(`/Contests/${id}`) },
  getContestResults(id: string) { return api.get(`/Contests/${id}/results`) },
  getTeamDetail(contestId: string, teamId: string) { return api.get(`/Contests/${contestId}/teams/${teamId}`) }
}
```

### 3. Router Routes

New public routes (no auth guard):
```typescript
{ path: '/contests', name: 'contests', component: () => import('@/views/ContestsView.vue'), meta: { guestOnly: false } }
{ path: '/contests/:id', name: 'contest-detail', component: () => import('@/views/ContestDetailView.vue') }
{ path: '/contests/:id/results', name: 'contest-results', component: () => import('@/views/ContestResultsView.vue') }
{ path: '/contests/:contestId/teams/:teamId', name: 'team-detail', component: () => import('@/views/TeamDetailView.vue') }
```

### 4. Views Structure

```
src/views/
  ContestsView.vue        — card list of visible contests
  ContestDetailView.vue   — contest header + class list + links
  ContestResultsView.vue  — tabbed results table (D-02)
  TeamDetailView.vue      — score summary + markings list (D-04)
```

### 5. Empty State Handling (D-03)

Per CONTEXT.md D-03: When `hasResults === false` or `teams === null`, show empty state with message "Results not yet available — contest may still be in progress."

---

## Key Decisions from Context

| Decision | Implementation |
|----------|----------------|
| D-01: Card layout for contests list | `<v-card>` or Tailwind card with status badge |
| D-02: Results as single table with class filter tabs | Tab component switching `contestClassOrderNr` filter |
| D-03: Empty state for in-progress contests | Conditional rendering based on `hasResults` flag |
| D-04: Score-focused team detail | Display: members, class, start/finish, score/bonus/penalty/finalScore, markings list |

---

## Requirements Coverage

| Requirement | Implementation |
|-------------|----------------|
| CONT-01: Browse visible contests | `GET /api/v1/Contests` → filter by visible date |
| CONT-02: View contest details with classes | `GET /api/v1/Contests/{id}` → render ContestDetails with ContestClassListItem[] |
| CONT-03: View contest results with rankings | `GET /api/v1/Contests/{id}/results` → TeamResultListItem[] |
| CONT-04: View individual team detail | `GET /api/v1/Contests/{contestId}/teams/{teamId}` → TeamResultDetail with markings |

---

## Common Pitfalls

1. **Route ordering:** `/contests/:id/results` must come before `/contests/:id` to prevent router from matching "results" as an id parameter
2. **No auth guard needed:** These are public routes — don't add `requiresAuth` meta
3. **Null handling:** `teams` in ContestResults is nullable — handle null gracefully
4. **Date formatting:** Display `visibleFrom`, `openFrom`, `openTo` in locale-appropriate format
5. **Tab filter logic:** When filtering by class, use `contestClassOrderNr` (not id) for ordering

---

## Validation Architecture

Not applicable for this phase — no Nyquist validation artifacts required.

---

*Research complete: 03-RESEARCH.md written*