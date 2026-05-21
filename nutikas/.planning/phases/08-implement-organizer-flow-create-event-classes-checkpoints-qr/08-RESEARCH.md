# Phase 8: implement-organizer-flow-create-event-classes-checkpoints-qr - Research

**Researched:** 2026-05-21
**Domain:** Vue 3 PWA organizer dashboard for rogaine event management
**Confidence:** HIGH

## Summary

This phase implements the organizer dashboard for rogaine event management — creating contests, configuring classes and checkpoints, generating printable QR codes, managing teams, and monitoring live markings during events. The backend already exposes all required `/api/v1/organiser/*` endpoints; the frontend needs Vue 3 views, a dedicated route with role-based guard, and organizer-specific API client functions.

Key findings:
- **No new backend needed** — all endpoints documented in `organizer-flow.md` and `api-spec.json`
- **QR generation client-side** using `qrcode` npm package, encoding `cpid` strings
- **Print view via `jspdf`** — generate PDF with checkpoint QR codes and `cpCode` labels
- **Live monitoring via polling** — no WebSocket; `GET /contests/{id}/markings?page=1&pageSize=50`
- **Role guard needed** — check `organiser` claim in JWT before rendering `/organizer` routes
- **Marking edits are raw row operations** — do NOT recompute team score; must update manually via team PUT

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth + role verification | Browser/Client + API/Backend | — | JWT claim check on client route guard, backend enforces |
| Org discovery | Browser/Client | — | Call `/organiser/organisations` after login to get org list |
| Contest CRUD | Browser/Client | API/Backend | Organizer creates/updates/deletes via forms |
| Class configuration | Browser/Client | API/Backend | Duration (seconds), maxDuration, penalty configuration |
| Checkpoint config + QR | Browser/Client | — | Forms for CP data, client-side QR generation, PDF print |
| Team management | Browser/Client | API/Backend | Create teams, add members by email |
| Live markings monitor | Browser/Client | — | Polling-based refresh, paginated display |
| On-behalf marking | Browser/Client | API/Backend | Form submitting to `POST /teams/{teamId}/markings` |
| Marking edit/delete | Browser/Client | API/Backend | Raw row ops — no auto-rescore |

## User Constraints (from 08-CONTEXT.md)

### Locked Decisions
- JWT auth + `organiser` role claim required for all `/api/v1/organiser/*` endpoints
- Route guard on `/organizer` checks JWT claim before rendering dashboard
- No separate login — same auth system as participants, role determines access
- Dashboard entry from header button → full-screen dashboard
- Exit dashboard via logo/home navigation
- Org-scoped via `organisationId`
- QR codes encode the `cpid` string — scanner reads cpid, not the GUID
- On-behalf marking uses `checkPointId` as GUID (not cpid string)
- Edit/delete raw marking does NOT recompute team score
- No explicit "close contest" — governed by `openTo <= now`

### the agent's Discretion
- UI component library details (Element Plus already in use)
- Dashboard layout specifics
- QR print layout/paper size
- Polling interval for live monitoring
- Specific form validation UX

### Deferred Ideas
None — full scope per `organizer-flow.md`

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | 3.5.34 | Framework | User-specified |
| Vue Router | 4.5.0 | Routing | User-specified |
| Pinia | 2.2.0 | State management | User-specified |
| Element Plus | 2.14.0 | UI component library | Already in use (package.json) |
| axios | 1.9.0 | HTTP client | Already in use (api/index.ts) |
| dexie | 4.4.2 | IndexedDB wrapper | Already in use (db/index.ts) |

### QR & Print
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `qrcode` | 1.5.4 | Client-side QR code generation | Pure JS, no server needed |
| `jspdf` | 4.2.1 | PDF generation for print view | Widely used, simple API |

**Installation:**
```bash
npm install qrcode jspdf
npm install -D @types/qrcode
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Vue 3 PWA)                                        │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │ AppHeader   │   │ OrganizerRouter │ │ AuthStore       │  │
│  │ (nav button)│──▶│ /organizer/*   │──│ (role checking) │  │
│  └─────────────┘   └──────────────┘   └─────────────────┘  │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │ Organizer   │  │ Contest     │  │ Checkpoint      │     │
│  │ Dashboard   │  │ Manager     │  │ Manager + QR    │     │
│  │ (contest    │  │ (CRUD)      │  │                 │     │
│  │  list)      │  │             │  │                 │     │
│  └─────────────┘  └─────────────┘  └─────────────────┘     │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          ▼                                  │
│              ┌─────────────────────┐                       │
│              │ organiserApi client │                       │
│              │ (extends api base)   │                       │
│              └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend: NestJS/.NET API                                    │
│                                                             │
│  GET/POST/PUT/DELETE /api/v1/organiser/*                    │
│  (requires JWT + organiser role + org membership)            │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── api/
│   └── endpoints/
│       └── organiser.ts      # New: organiser API client
├── stores/
│   └── organiser.ts          # New: organiser state (orgs, contests)
├── views/
│   ├── OrganizerDashboard.vue # New: contest list + create
│   ├── OrganizerContest.vue   # New: contest detail (classes, CPs, teams)
│   ├── OrganizerCheckpoint.vue # New: checkpoint CRUD + QR preview
│   ├── OrganizerMarkings.vue  # New: live markings monitor
│   └── OrganizerPrint.vue     # New: QR print view (PDF generation)
├── components/
│   └── Organizer/
│       ├── ContestForm.vue    # New: contest create/edit form
│       ├── ClassForm.vue      # New: class config form
│       ├── CheckpointForm.vue # New: checkpoint form
│       ├── TeamForm.vue       # New: team create/edit
│       ├── MarkingForm.vue    # New: on-behalf marking form
│       └── QrSheet.vue        # New: QR grid for print
└── router/
    └── index.ts               # Add /organizer/* routes with role guard
```

### Pattern 1: Organiser API Client
**What:** Extend existing axios API pattern with organiser-specific endpoints
**When to use:** All organiser API calls
**Example:**
```typescript
// src/api/endpoints/organiser.ts
import { api } from '@/api'
import type {
  OrganisationItem,
  OrganiserContestDetails,
  OrganiserCheckPointDetails,
  OrganiserTeamDetails,
  OrganiserMarkingListItem,
  PagedResponse
} from '@/types/api'

export const organiserApi = {
  // Organisations
  async getOrganisations(): Promise<OrganisationItem[]> {
    const res = await api.get('/organiser/Organisations')
    return res.data
  },

  // Contests
  async getContests(): Promise<OrganiserContestDetails[]> {
    const res = await api.get('/organiser/Contests')
    return res.data
  },
  async getContest(id: string): Promise<OrganiserContestDetails> {
    const res = await api.get(`/organiser/Contests/${id}`)
    return res.data
  },
  async createContest(data: OrganiserContestUpsertRequest): Promise<OrganiserContestDetails> {
    const res = await api.post('/organiser/Contests', data)
    return res.data
  },
  async updateContest(id: string, data: OrganiserContestUpsertRequest): Promise<OrganiserContestDetails> {
    const res = await api.put(`/organiser/Contests/${id}`, data)
    return res.data
  },
  async deleteContest(id: string): Promise<void> {
    await api.delete(`/organiser/Contests/${id}`)
  },

  // Classes
  async getClasses(contestId: string): Promise<OrganiserContestClassDetails[]> {
    const res = await api.get(`/organiser/contests/${contestId}/contest-classes`)
    return res.data
  },
  async createClass(contestId: string, data: OrganiserContestClassUpsertRequest): Promise<OrganiserContestClassDetails> {
    const res = await api.post(`/organiser/contests/${contestId}/contest-classes`, data)
    return res.data
  },
  async updateClass(id: string, data: OrganiserContestClassUpsertRequest): Promise<OrganiserContestClassDetails> {
    const res = await api.put(`/organiser/contest-classes/${id}`, data)
    return res.data
  },
  async deleteClass(id: string): Promise<void> {
    await api.delete(`/organiser/contest-classes/${id}`)
  },

  // Checkpoints
  async getCheckpoints(contestId: string): Promise<OrganiserCheckPointDetails[]> {
    const res = await api.get(`/organiser/contests/${contestId}/check-points`)
    return res.data
  },
  async createCheckpoint(contestId: string, data: OrganiserCheckPointUpsertRequest): Promise<OrganiserCheckPointDetails> {
    const res = await api.post(`/organiser/contests/${contestId}/check-points`, data)
    return res.data
  },
  async updateCheckpoint(id: string, data: OrganiserCheckPointUpsertRequest): Promise<OrganiserCheckPointDetails> {
    const res = await api.put(`/organiser/check-points/${id}`, data)
    return res.data
  },
  async deleteCheckpoint(id: string): Promise<void> {
    await api.delete(`/organiser/check-points/${id}`)
  },

  // Teams
  async getTeams(contestId: string): Promise<OrganiserTeamDetails[]> {
    const res = await api.get(`/organiser/contests/${contestId}/teams`)
    return res.data
  },
  async getTeam(id: string): Promise<OrganiserTeamDetails> {
    const res = await api.get(`/organiser/Teams/${id}`)
    return res.data
  },
  async createTeam(contestId: string, data: OrganiserTeamUpsertRequest): Promise<OrganiserTeamDetails> {
    const res = await api.post(`/organiser/contests/${contestId}/teams`, data)
    return res.data
  },
  async updateTeam(id: string, data: OrganiserTeamUpsertRequest): Promise<OrganiserTeamDetails> {
    const res = await api.put(`/organiser/Teams/${id}`, data)
    return res.data
  },
  async deleteTeam(id: string): Promise<void> {
    await api.delete(`/organiser/Teams/${id}`)
  },

  // Team members (UserTeams)
  async getTeamMembers(teamId: string): Promise<OrganiserUserTeamItem[]> {
    const res = await api.get(`/organiser/teams/${teamId}/user-teams`)
    return res.data
  },
  async addTeamMember(teamId: string, email: string): Promise<OrganiserUserTeamItem> {
    const res = await api.post(`/organiser/teams/${teamId}/user-teams`, { email })
    return res.data
  },
  async removeTeamMember(userTeamId: string): Promise<void> {
    await api.delete(`/organiser/user-teams/${userTeamId}`)
  },

  // Markings
  async getMarkings(contestId: string, page = 1, pageSize = 25, teamId?: string): Promise<PagedResponse<OrganiserMarkingListItem>> {
    const params: any = { page, pageSize }
    if (teamId) params.teamId = teamId
    const res = await api.get(`/organiser/contests/${contestId}/markings`, { params })
    return res.data
  },
  async getMarking(id: string): Promise<OrganiserMarkingDetails> {
    const res = await api.get(`/organiser/Markings/${id}`)
    return res.data
  },
  async createMarking(teamId: string, data: OrganiserMarkingCreateRequest): Promise<MarkingResponse> {
    const res = await api.post(`/organiser/teams/${teamId}/markings`, data)
    return res.data
  },
  async updateMarking(id: string, data: OrganiserMarkingUpdateRequest): Promise<OrganiserMarkingDetails> {
    const res = await api.put(`/organiser/Markings/${id}`, data)
    return res.data
  },
  async deleteMarking(id: string): Promise<void> {
    await api.delete(`/organiser/Markings/${id}`)
  }
}
```

### Pattern 2: Role Guard for Organiser Routes
**What:** Check JWT payload for `organiser` role before rendering dashboard
**When to use:** Every organiser route
**Example:**
```typescript
// src/router/index.ts (add to existing)
{
  path: '/organizer',
  component: () => import('@/views/OrganizerDashboard.vue'),
  meta: { requiresAuth: true, requiresRole: 'organiser' }
},
{
  path: '/organizer/contest/:id',
  component: () => import('@/views/OrganizerContest.vue'),
  meta: { requiresAuth: true, requiresRole: 'organiser' }
},
{
  path: '/organizer/contest/:contestId/checkpoints',
  component: () => import('@/views/OrganizerCheckpoint.vue'),
  meta: { requiresAuth: true, requiresRole: 'organiser' }
},
{
  path: '/organizer/contest/:contestId/markings',
  component: () => import('@/views/OrganizerMarkings.vue'),
  meta: { requiresAuth: true, requiresRole: 'organiser' }
},
{
  path: '/organizer/contest/:contestId/print',
  component: () => import('@/views/OrganizerPrint.vue'),
  meta: { requiresAuth: true, requiresRole: 'organiser' }
}

// In router.beforeEach:
if (to.meta.requiresRole === 'organiser') {
  const payload = JSON.parse(atob(auth.jwt!.split('.')[1]))
  if (!payload.role?.includes('organiser')) {
    return { name: 'contests' } // or show 403
  }
}
```

### Pattern 3: QR Code Generation + PDF Print
**What:** Generate QR codes for checkpoint `cpid` values, embed in printable PDF
**When to use:** Checkpoint management and print view
**Example:**
```typescript
// src/composables/useQrCode.ts
import QRCode from 'qrcode'

export function useQrCode() {
  async function generateQrDataUrl(cpid: string): Promise<string> {
    return QRCode.toDataURL(cpid, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
  }

  async function generateQrSvg(cpid: string): Promise<string> {
    return QRCode.toString(cpid, { type: 'svg' })
  }

  return { generateQrDataUrl, generateQrSvg }
}

// src/views/OrganizerPrint.vue (using jspdf)
import { jsPDF } from 'jspdf'
import { useQrCode } from '@/composables/useQrCode'

async function printQrSheet(checkpoints: OrganiserCheckPointDetails[]) {
  const doc = new jsPDF()
  const { generateQrDataUrl } = useQrCode()
  
  const cols = 3
  const cellW = 60
  const cellH = 70
  const startX = 15
  const startY = 20

  for (let i = 0; i < checkpoints.length; i++) {
    const cp = checkpoints[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = startX + col * cellW
    const y = startY + row * cellH

    const qrDataUrl = await generateQrDataUrl(cp.cpid)
    doc.addImage(qrDataUrl, 'PNG', x, y, 40, 40)
    doc.text(cp.cpCode, x + 20, y + 48, { align: 'center' })
    doc.text(cp.cpid, x, y + 55, { align: 'center' })
  }

  doc.save('checkpoints.pdf')
}
```

### Pattern 4: Live Markings Polling
**What:** Poll markings endpoint at intervals during active event
**When to use:** Markings monitor view
**Example:**
```typescript
// src/views/OrganizerMarkings.vue
import { ref, onMounted, onUnmounted } from 'vue'
import { organiserApi } from '@/api/endpoints/organiser'

const markings = ref<OrganiserMarkingListItem[]>([])
const page = ref(1)
const pageSize = ref(50)
const totalPages = ref(1)
let pollInterval: number | null = null

async function loadMarkings() {
  const contestId = route.params.contestId
  const resp = await organiserApi.getMarkings(contestId, page.value, pageSize.value)
  markings.value = resp.items
  totalPages.value = resp.totalPages
}

onMounted(() => {
  loadMarkings()
  pollInterval = setInterval(loadMarkings, 10000) // poll every 10s
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code generation | Custom canvas drawing for QR codes | `qrcode` npm package | Error correction, encoding handled correctly |
| PDF generation | Window.print() with CSS page breaks | `jspdf` npm package | Cross-browser, consistent output |
| JWT role checking | Parse JWT manually in every component | Extend auth store + router guard | Centralized, consistent |
| API client | Duplicate axios calls everywhere | `organiserApi` singleton | Consistent error handling, typed |
| Time zone handling | Assume local time | ISO 8601 UTC on wire, Element Plus date pickers with utc mode | Backend stores UTC |

**Key insight:** The backend already implements all business logic — this phase only needs to wire the frontend to the existing API. Do not re-implement scoring, time validation, or CP state machine — these live in `BLL.App.CpMarking.StandardRogain()` on the backend.

## Common Pitfalls

### Pitfall 1: Frontend-only role check is not security
**What goes wrong:** Checking `organiser` role in Vue router before navigation is UX only — a user can bypass it by calling the API directly with the JWT.
**Why it happens:** The backend enforces role-based authorization on all `/organiser/*` endpoints. Frontend checks are for UX only.
**How to avoid:** Both checks are needed: frontend for UX (redirect non-organisers away from nav button), backend for security (returns 403 if role missing).
**Warning signs:** Organiser nav button visible for non-organisers who somehow got a JWT.

### Pitfall 2: CPID uniqueness not validated before submit
**What goes wrong:** User enters duplicate `cpid` on checkpoint create → backend returns `400 RestApiErrorResponse` with message "CPID '...' is already used in this contest."
**Why it happens:** The backend enforces uniqueness within a contest, not globally.
**How to avoid:** Fetch existing checkpoints for the contest before rendering the form, or handle the 400 error gracefully with user feedback.

### Pitfall 3: Contest deletion fails due to dependents
**What goes wrong:** `DELETE /api/v1/organiser/contests/{id}` returns `500` when classes/checkpoints/teams exist.
**Why it happens:** Cascade delete is intentionally disabled in `AppDbContext`.
**How to avoid:** Delete dependents in order before deleting contest: markings → user-teams → teams → checkpoints → classes → contest. Provide a cleanup UI or confirmation dialog.

### Pitfall 4: Editing marking does NOT update team score
**What goes wrong:** Organizer edits a marking's score, expects team totals to update automatically.
**Why it happens:** `PUT /api/v1/organiser/markings/{id}` is a raw row update — it rewrites the `Marking` row but does not re-run the scoring engine.
**How to avoid:** After editing a marking, manually update the team's `score/bonus/penalty/finalScore` via `PUT /api/v1/organiser/teams/{teamId}`. Document this behavior in the UI.

### Pitfall 5: Marking on-behalf uses wrong ID type
**What goes wrong:** Submitter passes `cpid` string to `POST /api/v1/organiser/teams/{teamId}/markings` instead of `CheckPoint.Id` GUID.
**Why it happens:** Participant API uses `cpid` string; organiser API uses `checkPointId` GUID.
**How to avoid:** Use the checkpoint's database `id` (GUID), not the `cpid` string. Display both in UI to prevent confusion.

### Pitfall 6: Wrong date-time handling
**What goes wrong:** Sending local times without timezone info, causing silent shift.
**Why it happens:** EF value converter coerces zone-less times to UTC, but sending local times that represent local time will shift.
**How to avoid:** Always send ISO 8601 UTC times from the frontend, or use Element Plus date pickers configured for UTC.

## Code Examples

### Contest Create Request Shape
```typescript
// src/types/api.ts (add to existing)
export interface OrganiserContestUpsertRequest {
  name: string
  visibleFrom: string  // ISO 8601 UTC
  openFrom: string      // ISO 8601 UTC
  openTo: string        // ISO 8601 UTC
  bonusTimeStart?: string | null
  bonusTimeEnd?: string | null
  bonusPerMarking: number
  organisationId: string
}
```

### Checkpoint Types Enum
```typescript
// Domain.ECheckPointType from api-spec.json
// 1 = Regular, 2 = Finish, 3 = Start, 4 = NoScore
export enum ECheckPointType {
  Regular = 1,
  Finish = 2,
  Start = 3,
  NoScore = 4
}
```

### Marking Response (on-behalf)
```typescript
// POST /api/v1/organiser/teams/{teamId}/markings returns MarkingResponse
// Always 200 OK, inspect statusOk + statusCode for domain errors
export interface MarkingResponse {
  statusOk: boolean
  statusCode: EApiStatusCode  // 0=OK, 1+=domain error
  message: string
  result: UserTeamActivation  // post-mark state
}
```

### Paged Response Shape
```typescript
// GET /api/v1/organiser/contests/{contestId}/markings
export interface PagedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side QR generation | Client-side via `qrcode` library | Common in SPAs | No server round-trip for generation |
| Server-side PDF rendering | Client-side via `jspdf` | Common in SPAs | PDF generates in browser, no server load |
| WebSocket live updates | Polling-based refresh | Acceptable per REQUIREMENTS.md | Simpler infrastructure, eventual consistency |

**Deprecated/outdated:**
- None identified for this phase.

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `qrcode` npm package handles Estonian characters in cpid correctly | QR Code Generation | Low — qrcode handles UTF-8 natively |
| A2 | `jspdf` supports embedding QR images as PNG data URLs | QR Code Generation | Low — documented capability |
| A3 | Element Plus date picker can be configured for UTC | Date Handling | Low — standard library capability |
| A4 | JWT payload has `role` claim as array or string | Role Guard | Medium — depends on backend token generation; if string, includes check must handle both |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **JWT role claim format**
   - What we know: JWT contains a `role` claim for the `organiser` role
   - What's unclear: Is it a string `"organiser"` or an array `["organiser"]`?
   - Recommendation: Check backend token generation (`App.DTO.v1.Identity.JWTResponse` or similar) or test decoding a known organiser's JWT

2. **Print layout preferences**
   - What we know: QR codes + cpCode labels needed for print
   - What's unclear: Paper size (A4?), QR grid size (3xN?), include contest name?
   - Recommendation: Default to A4 with 3-column grid, allow customization in print view

3. **Polling interval for live markings**
   - What we know: No WebSocket, polling acceptable per REQUIREMENTS.md
   - What's unclear: What interval? 10s? 30s? User configurable?
   - Recommendation: Start with 10s, make configurable via env or settings

4. **Org-switcher behavior**
   - What we know: User can belong to multiple organisations
   - What's unclear: Should the dashboard support switching between orgs, or show all orgs' contests in one view?
   - Recommendation: Show all contests across all orgs, filter by org in list

## Environment Availability

> Skip this section if the phase has no external dependencies (code/config-only changes).

Step 2.6: SKIPPED (no external dependencies identified — backend exists, npm packages available)

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already in project via vite-plugin-pwa) |
| Config file | `vitest.config.ts` (not yet present — see Wave 0) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORGN-01 | Organiser can create contests | unit | `vitest tests/api/organiser.spec.ts` | ❌ Wave 0 |
| ORGN-01 | Organiser can view own contests | unit | `vitest tests/api/organiser.spec.ts` | ❌ Wave 0 |
| ORGN-01 | Organiser can edit contests | unit | `vitest tests/api/organiser.spec.ts` | ❌ Wave 0 |
| ORGN-02 | Organiser can manage checkpoints | unit | `vitest tests/api/organiser.spec.ts` | ❌ Wave 0 |
| ORGN-02 | QR code encodes cpid correctly | unit | `vitest tests/composables/useQrCode.spec.ts` | ❌ Wave 0 |
| ORGN-02 | PDF generation works | unit | `vitest tests/views/OrganizerPrint.spec.ts` | ❌ Wave 0 |
| ORGN-03 | Markings paginated, ordered newest-first | unit | `vitest tests/api/organiser.spec.ts` | ❌ Wave 0 |
| ORGN-03 | On-behalf marking uses GUID not cpid | unit | `vitest tests/api/organiser.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — test configuration
- [ ] `tests/api/organiser.spec.ts` — organiser API client tests
- [ ] `tests/composables/useQrCode.spec.ts` — QR generation tests
- [ ] `tests/views/OrganizerPrint.spec.ts` — PDF generation tests
- [ ] `tests/views/OrganizerDashboard.spec.ts` — dashboard tests
- [ ] Framework install: `npm install -D vitest @vue/test-utils` — if not already present

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT via existing auth store, role claim in JWT |
| V3 Session Management | yes | JWT persistence in IndexedDB (existing pattern) |
| V4 Access Control | yes | Organiser role check on frontend (UX) + backend (security) |
| V5 Input Validation | yes | Element Plus form validation + API validation |
| V6 Cryptography | no | No crypto operations in frontend |

### Known Threat Patterns for Vue 3 SPA + NestJS API

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Organiser accesses another org's contest | Information Disclosure | Backend returns 404 for cross-org resources |
| Role claim spoofing | Elevation of Privilege | Backend validates JWT and role claim on every request |
| CSRF on organiser actions | Tampering | CORS configured, SameSite cookies |
| JWT stored in localStorage (XSS) | Information Disclosure | IndexedDB used instead per existing auth store |

## Sources

### Primary (HIGH confidence)
- `devhelp/organizer-flow.md` — complete end-to-end organiser API documentation, all endpoint shapes, validation rules, domain behavior
- `devhelp/api-spec.json` — OpenAPI 3.0.4 spec with all organiser DTOs, endpoint definitions, response shapes
- `src/api/index.ts` — existing API client implementation (axios, interceptors, token refresh)
- `src/stores/auth.ts` — existing auth store with JWT handling, token persistence
- `src/router/index.ts` — existing router with auth guards
- `package.json` — verified dependency versions

### Secondary (MEDIUM confidence)
- [qrcode npm package](https://www.npmjs.com/package/qrcode) — npm 1.5.4, verified by `npm view qrcode version`
- [jspdf npm package](https://www.npmjs.com/package/jspdf) — npm 4.2.1, verified by `npm view jspdf version`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing project conventions + verified npm packages
- Architecture: HIGH — follows existing patterns from codebase
- Pitfalls: HIGH — documented from backend API spec, verified against organizer-flow.md

**Research date:** 2026-05-21
**Valid until:** 2026-06-21 (30 days — backend API stable, library versions confirmed)

---

*Research complete. Planner can now create PLAN.md files for Phase 8.*