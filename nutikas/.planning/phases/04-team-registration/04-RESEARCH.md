# Phase 4: Team Registration - Research

**Researched:** 2026-05-13
**Domain:** Team registration via authenticated API, IndexedDB persistence for active team
**Confidence:** HIGH

## Summary

Phase 4 implements authenticated team registration for contests. The backend API accepts `POST /api/v1/Contests/{contestId}/teams` with `teamName`, `teamMembers` (comma-separated), and `contestClassId`. User's existing teams are retrieved via `GET /api/v1/Contests/{contestId}/userteams`. The active team persists in IndexedDB via Dexie (same `NutikasAuth` database as auth tokens, but new table version).

**Primary recommendation:** Extend existing Dexie database with new `activeTeam` table, create `useTeamStore` following the exact composable pattern from `useContestStore`, add registration modal to `ContestDetailView`, create new `MyTeamsView` at `/contests/:id/my-teams`.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Registration form is a modal/dialog overlay on ContestDetailView
- **D-02:** Class selection via radio buttons (single select)
- **D-03:** Team members entered as single comma-separated text field
- **D-06:** My Teams is a separate route `/contests/:id/my-teams`
- **D-09:** Active team stored in IndexedDB via Dexie (same storage as auth tokens)
- **D-10:** Active team requires explicit user selection

### the agent's Discretion
- Form field labels and placeholder text — agent uses standard conventions
- Toast notification styling — match existing UI patterns
- List item visual design (card vs row) — agent picks based on mobile UX best practices
- Expandable animation and interaction details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEAM-01 | Authenticated user can register a team for a contest | API client for POST /teams, form validation, modal UX |
| TEAM-02 | User can view their registered teams in a contest | API client for GET /userteams, MyTeamsView list |
| TEAM-03 | User can view details of their registered team | Inline expandable in MyTeamsView, API client for GET /UserTeams/{id} |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Team registration form | Frontend (Vue) | — | Modal overlay on ContestDetailView, no backend rendering |
| Team registration API | API / Backend | — | POST /api/v1/Contests/{contestId}/teams — requires JWT auth |
| Team list display | Frontend (Vue) | — | MyTeamsView, no backend rendering |
| Active team persistence | Browser / Client | — | IndexedDB via Dexie — survives page refresh |
| Active team selection | Frontend (Vue) | — | Explicit user action stores to IndexedDB |
| Race resumption (Phase 5) | Browser / Client | — | Reads activeTeam from IndexedDB to pre-select team |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | 3.5.34 | UI framework | Project baseline |
| Pinia | 2.2.0 | State management | Already in use (useContestStore, useAuthStore) |
| Vue Router | 4.5.0 | Routing | Already in use, needs new routes for /my-teams |
| Dexie | 4.4.2 | IndexedDB wrapper | Already in use (NutikasAuth db), needed for activeTeam |
| Axios | 1.9.0 | HTTP client | Already in use (api client), interceptors already handle JWT |
| Tailwind CSS | 3.4.0 | Styling | Already in use |

### No New Dependencies Required
This phase uses only existing dependencies. All functionality is achieved by extending existing patterns.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ ContestDetailView (existing)                            │
│  ├─ "Register" button → opens RegistrationModal         │
│  └─ "My Teams" link → navigates to /contests/:id/my-teams│
└─────────────────────────────────────────────────────────┘

RegistrationModal (new)
  ├─ teamName input (text)
  ├─ teamMembers input (comma-separated text)
  ├─ contestClassId (radio buttons from contest.contestClasses)
  └─ Submit → POST /api/v1/Contests/{contestId}/teams

MyTeamsView (new)
  ├─ GET /api/v1/Contests/{contestId}/userteams → list
  ├─ Each item: expandable inline detail
  │   └─ "Set as Active" button → writes to activeTeam (IndexedDB)
  └─ Back navigation

IndexedDB (NutikasAuth)
  ├─ auth table (existing): jwt, refreshToken
  └─ activeTeam table (new): { id, teamId, contestId, teamName, contestClassId }
```

### Recommended Project Structure
```
src/
├── api/
│   └── team.ts              # NEW: Team API client functions
├── stores/
│   └── team.ts             # NEW: Team store (Pinia, composable pattern)
├── views/
│   └── MyTeamsView.vue     # NEW: Team list with expandable details
├── components/
│   └── RegistrationModal.vue  # NEW: Modal with registration form
├── db/
│   └── index.ts            # MODIFIED: Add activeTeam table to NutikasAuth
└── types/
    └── team.ts             # NEW: TypeScript types for team DTOs
```

### Pattern 1: Dexie Table Extension (for activeTeam)
**What:** Extend existing `NutikasAuth` Dexie database with new version and `activeTeam` table
**When to use:** When persisting new client-side data alongside existing auth tokens
**Example:**
```typescript
// src/db/index.ts — existing NutikasAuth class
export class NutikasAuth extends Dexie {
  auth!: Table<{ key: string; value: string }>
  activeTeam!: Table<ActiveTeamRecord>  // NEW

  constructor() {
    super('NutikasAuth')
    this.version(1).stores({
      auth: 'key'
    })
    // NEW: Add version 2 for activeTeam table
    this.version(2).stores({
      activeTeam: 'id'
    })
  }
}
```
**Source:** [VERIFIED: dexie.org docs — "Add New Tables to Schema"]

### Pattern 2: Pinia Setup Store with IndexedDB Persistence
**What:** Store team data in component state, persist activeTeam to IndexedDB via Dexie
**When to use:** For team store that needs to sync active team selection to IndexedDB
**Example:**
```typescript
// src/stores/team.ts
export const useTeamStore = defineStore('team', () => {
  const myTeams = ref<UserTeamListItem[]>([])
  const activeTeam = ref<ActiveTeamRecord | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load activeTeam from IndexedDB on init
  async function loadActiveTeam(): Promise<void> {
    const record = await db.activeTeam.get('current')
    activeTeam.value = record ?? null
  }

  // Persist activeTeam selection to IndexedDB
  async function setActiveTeam(team: ActiveTeamRecord): Promise<void> {
    await db.activeTeam.put({ id: 'current', ...team })
    activeTeam.value = team
  }

  async function clearActiveTeam(): Promise<void> {
    await db.activeTeam.delete('current')
    activeTeam.value = null
  }

  return { myTeams, activeTeam, loading, error, loadActiveTeam, setActiveTeam, clearActiveTeam }
})
```
**Source:** [VERIFIED: auth.ts pattern — same pattern used for JWT persistence]

### Pattern 3: Modal-Based Form with Inline Validation
**What:** Registration form shown in modal overlay, validation errors displayed below each field
**When to use:** For lightweight form UX that keeps user in context
**Example:**
```vue
<!-- RegistrationModal.vue -->
<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <h2>Register Team</h2>
      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label>Team Name</label>
          <input v-model="form.teamName" type="text" />
          <span v-if="errors.teamName" class="error">{{ errors.teamName }}</span>
        </div>
        <div class="field">
          <label>Team Members</label>
          <input v-model="form.teamMembers" type="text" placeholder="John, Jane, Bob" />
          <span v-if="errors.teamMembers" class="error">{{ errors.teamMembers }}</span>
        </div>
        <div class="field">
          <label>Class</label>
          <div v-for="cls in contestClasses" :key="cls.id" class="radio-option">
            <input type="radio" v-model="form.contestClassId" :value="cls.id" />
            <span>{{ cls.name }} ({{ formatDuration(cls.duration) }})</span>
          </div>
          <span v-if="errors.contestClassId" class="error">{{ errors.contestClassId }}</span>
        </div>
        <button type="submit" :disabled="loading">Register</button>
      </form>
    </div>
  </div>
</template>
```
**Source:** [ASSUMED: matches D-01, D-02, D-03, D-04 from CONTEXT.md]

### Pattern 4: Expandable List Items (My Teams)
**What:** Team list where each item expands inline to show details
**When to use:** For My Teams view where user needs details without navigation
**Example:**
```vue
<!-- MyTeamsView.vue -->
<template>
  <div class="my-teams">
    <div v-for="team in store.myTeams" :key="team.id" class="team-item">
      <div class="team-header" @click="toggleExpand(team.id)">
        <span>{{ team.teamName }}</span>
        <span>{{ team.contestClassName }}</span>
      </div>
      <div v-if="expandedId === team.id" class="team-detail">
        <p>Members: {{ team.memberNames }}</p>
        <button v-if="!isActiveTeam(team.id)" @click="setActive(team)">Set as Active</button>
      </div>
    </div>
  </div>
</template>
```
**Source:** [ASSUMED: matches D-07, D-08, D-10 from CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB access | Raw IndexedDB API | Dexie (already in project) | Dexie provides typed tables, migration support, cleaner async API |
| API HTTP calls | fetch() | Axios (already configured) | Axios has interceptors for JWT, error handling, timeout configured |
| Toast notifications | Custom implementation | VueUse useToast or inline notification | [ASSUMED — agent discretion per CONTEXT.md] |
| Form validation | Custom validators | Simple inline checks | [ASSUMED — agent discretion, keep lightweight] |

**Key insight:** This phase reuses extensively — Dexie for persistence, Axios for HTTP, existing store patterns. The only "new" work is the business logic and UI components.

## Common Pitfalls

### Pitfall 1: Forgetting to Update Dexie Version
**What goes wrong:** New table not created if version number not incremented
**Why it happens:** Dexie requires explicit version increment for schema changes
**How to avoid:** Always increment version when adding new tables: `db.version(2).stores({ activeTeam: 'id' })`
**Source:** [VERIFIED: dexie.org — "When adding new tables, only need to specify the new table schemas"]

### Pitfall 2: Not Loading Active Team on App Init
**What goes wrong:** Race condition where Phase 5 tries to read activeTeam before it's loaded
**Why it happens:** Pinia stores initialize synchronously but IndexedDB is async
**How to avoid:** Ensure `loadActiveTeam()` is called before Phase 5 components mount. Consider calling in `main.ts` before mounting app or in auth store initialization.

### Pitfall 3: Not Handling 401 on Authenticated Team Endpoints
**What goes wrong:** User registers team but request fails silently due to expired JWT
**Why it happens:** Team endpoints require auth but may not be handled by existing refresh logic
**How to avoid:** Verify `api/interceptors/response` handles 401 for ALL authenticated endpoints. The current interceptor should cover this since it checks `originalRequest._retry` generically.

### Pitfall 4: Comma Parsing Edge Cases
**What goes wrong:** "John Smith, Jane Doe" treated as two teams instead of members with spaces
**Why it happens:** naive split(',') doesn't handle names with spaces
**How to avoid:** Use `split(',').map(s => s.trim())` and validate each member name is non-empty after trim

### Pitfall 5: Radio Group Not Binding Correctly
**What goes wrong:** Class selection doesn't update form model
**Why it happens:** Vue radio inputs with v-model need correct value binding
**How to avoid:** Use `:value="cls.id"` not just `value="cls.id"` for UUID values

## Code Examples

### Team API Client (new file)
```typescript
// src/api/team.ts
import { api } from '@/api'
import type { UserTeamListItem, TeamRegistrationRequest, UserTeamActivation } from '@/types/team'

/**
 * POST /api/v1/Contests/{contestId}/teams — register a team
 */
export async function registerTeam(
  contestId: string,
  request: TeamRegistrationRequest
): Promise<UserTeamListItem> {
  const response = await api.post<UserTeamListItem>(
    `/Contests/${contestId}/teams`,
    request
  )
  return response.data
}

/**
 * GET /api/v1/Contests/{contestId}/userteams — get user's teams for contest
 */
export async function getUserTeams(contestId: string): Promise<UserTeamListItem[]> {
  const response = await api.get<UserTeamListItem[]>(
    `/Contests/${contestId}/userteams`
  )
  return response.data
}

/**
 * GET /api/v1/UserTeams/{id} — get team activation detail
 */
export async function getUserTeamActivation(teamId: string): Promise<UserTeamActivation> {
  const response = await api.get<UserTeamActivation>(
    `/UserTeams/${teamId}`
  )
  return response.data
}
```
**Source:** [VERIFIED: api-spec.json lines 820-887, 1729-1787 — exact endpoints and response types]

### Dexie Schema Extension (src/db/index.ts)
```typescript
// Add to NutikasAuth class
this.version(2).stores({
  activeTeam: 'id'
})
```
**Source:** [VERIFIED: dexie.org — versioning documentation]

### Team Store (new file)
```typescript
// src/stores/team.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as teamApi from '@/api/team'
import { db } from '@/db'
import type { UserTeamListItem, UserTeamActivation } from '@/types/team'

interface ActiveTeamRecord {
  id: string        // constant 'current'
  teamId: string
  contestId: string
  teamName: string
  contestClassId: string
}

export const useTeamStore = defineStore('team', () => {
  const myTeams = ref<UserTeamListItem[]>([])
  const activeTeam = ref<ActiveTeamRecord | null>(null)
  const currentTeamDetail = ref<UserTeamActivation | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadActiveTeam(): Promise<void> {
    const record = await db.activeTeam.get('current')
    activeTeam.value = record ?? null
  }

  async function setActiveTeam(team: UserTeamListItem): Promise<void> {
    const record: ActiveTeamRecord = {
      id: 'current',
      teamId: team.id,
      contestId: team.teamId,  // Note: API returns teamId on UserTeamListItem
      teamName: team.teamName,
      contestClassId: team.contestClassId
    }
    await db.activeTeam.put(record)
    activeTeam.value = record
  }

  async function clearActiveTeam(): Promise<void> {
    await db.activeTeam.delete('current')
    activeTeam.value = null
  }

  async function fetchMyTeams(contestId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      myTeams.value = await teamApi.getUserTeams(contestId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch teams'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTeamDetail(teamId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      currentTeamDetail.value = await teamApi.getUserTeamActivation(teamId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch team detail'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    myTeams, activeTeam, currentTeamDetail, loading, error,
    loadActiveTeam, setActiveTeam, clearActiveTeam,
    fetchMyTeams, fetchTeamDetail
  }
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SessionStorage for tokens | IndexedDB via Dexie | Phase 2 | Survives browser refresh, larger storage capacity |
| Page reload loses active contest | ActiveTeam in IndexedDB | Phase 4 | Phase 5 can pre-select team on resume |
| Form in separate page | Modal overlay | Phase 4 | Lighter UX, user stays in contest context |
| Navigation to team detail page | Expandable inline detail | Phase 4 | Faster exploration, no page transitions |

**Deprecated/outdated:**
- None relevant to this phase

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Toast notification uses VueUse useToast composable | Common Pitfalls | If project uses different toast lib, styling will mismatch |
| A2 | Registration modal triggered by ContestDetailView "Register" button | Architecture | If button click doesn't open modal, UX flow breaks |
| A3 | Active team selection persists only the teamId and contestId | Don't Hand-Roll | Phase 5 may need full team details, requiring different schema |

## Open Questions

1. **Should activeTeam store just the teamId (and Phase 5 fetches full details)?**
   - What we know: D-09 says "Active team stored in IndexedDB", D-10 says "requires explicit user selection"
   - What's unclear: Whether activeTeam should store full team snapshot or just reference ID
   - Recommendation: Store minimal `{ id, teamId, contestId }` — Phase 5 fetches full activation detail via API

2. **What happens if user has no teams and navigates to /my-teams?**
   - What we know: GET /userteams returns empty array
   - What's unclear: Should we show empty state with "Register your first team" prompt?
   - Recommendation: Yes — show helpful empty state with link back to registration

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified beyond existing project stack)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected (no test config found) |
| Config file | N/A |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEAM-01 | POST /api/v1/Contests/{id}/teams with valid request | unit | N/A (API test) | ❌ |
| TEAM-01 | Form validates required fields | unit | N/A (component test) | ❌ |
| TEAM-01 | Success shows toast + closes modal | manual | — | — |
| TEAM-02 | GET /api/v1/Contests/{id}/userteams returns team list | unit | N/A (API test) | ❌ |
| TEAM-02 | MyTeamsView displays all user teams | manual | — | — |
| TEAM-03 | GET /api/v1/UserTeams/{id} returns activation detail | unit | N/A (API test) | ❌ |
| TEAM-03 | Expandable shows team details inline | manual | — | — |
| D-09 | activeTeam persists to IndexedDB | unit | N/A (requires browser env) | ❌ |
| D-10 | Set as Active updates activeTeam record | manual | — | — |

### Wave 0 Gaps
- [ ] `src/stores/team.ts` — covers TEAM-01, TEAM-02, TEAM-03, D-09, D-10
- [ ] `src/api/team.ts` — covers API calls for TEAM-01, TEAM-02, TEAM-03
- [ ] `src/types/team.ts` — covers TypeScript types
- [ ] `src/views/MyTeamsView.vue` — covers TEAM-02, TEAM-03
- [ ] `src/components/RegistrationModal.vue` — covers TEAM-01
- [ ] `src/db/index.ts` modification — covers D-09

**No existing test infrastructure** — phase deliverables are all new files, no tests to add to existing infrastructure.

## Security Domain

> security_enforcement is enabled (default). Phase uses authenticated API with JWT.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT stored in IndexedDB (handled by existing auth.ts) |
| V3 Session Management | partial | Active team selection is explicit, not automatic — user controls |
| V4 Access Control | yes | Auth guard on /contests/:id/my-teams route — only authenticated users |
| V5 Input Validation | yes | Client-side validation on teamName, teamMembers, contestClassId |

### Known Threat Patterns for {Vue + Axios + IndexedDB}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JWT stored in IndexedDB — XSS theft | Information Disclosure | CSP policy, no eval(), httponly cookies alternative (out of scope for PWA) |
| Team registration pollution | Tampering | Server validates contestId belongs to user, contest is open |
| Active team injection | Elevation of Privilege | D-10 requires explicit user selection — no auto-selection |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: dexie.org docs] — Dexie schema versioning, table extension patterns
- [VERIFIED: api-spec.json lines 820-887] — POST /Contests/{contestId}/teams, GET /userteams endpoint specs
- [VERIFIED: api-spec.json lines 1729-1787] — GET /UserTeams/{id} UserTeamActivation response
- [VERIFIED: api-spec.json lines 2861-2885] — TeamRegistrationRequest schema
- [VERIFIED: api-spec.json lines 3064-3107] — UserTeamListItem schema
- [VERIFIED: dexie.org] — Dexie 4.4.2 version confirmed via npm

### Secondary (MEDIUM confidence)
- [VERIFIED: vuejs/pinia] — Pinia setup store pattern via Context7
- [VERIFIED: vuejs/vue-router] — Navigation guards with meta fields via Context7

### Tertiary (LOW confidence)
- [ASSUMED] — Toast notification implementation approach
- [ASSUMED] — Modal animation/interaction details
- [ASSUMED] — Empty state UX for My Teams with no teams

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all dependencies verified, versions confirmed via npm
- Architecture: HIGH — follows established project patterns exactly
- Pitfalls: MEDIUM — verified Dexie pattern, other pitfalls are assumed

**Research date:** 2026-05-13
**Valid until:** 2026-06-12 (30 days — Vue/Pinia/Dexie are stable libraries)