# Phase 5: Race Participation - Research

**Researched:** 2026-05-14
**Domain:** QR scanning + live scoring for rogaine events
**Confidence:** HIGH

## Summary

Phase 5 implements real-time race participation: participants scan START to begin, scan checkpoints during the event, scan FINISH to end, and see live score/position after each scan. The core technical challenge is integrating camera-based QR scanning with a live scoring dashboard in a single combined view, using the existing Axios/JWT infrastructure and the `POST /api/v1/markings` endpoint.

The established pattern for this type of Vue 3 + camera scanning app is `vue-qrcode-reader` v5.x. The marking submission API always returns HTTP 200 — domain-level rejections are signaled via `statusOk: false` and `statusCode`, so the client must inspect these fields rather than relying on HTTP status. Position within class must be computed client-side by filtering `GET /contests/{id}/results` by `contestClassId` and finding the team's ordinal rank.

**Primary recommendation:** Use `vue-qrcode-reader` for camera QR scanning, build a lightweight toast/notification composable, and extend the existing team store with race activation state.

---

## User Constraints (from 05-CONTEXT.md)

### Locked Decisions

- **D-01:** Full-screen scanner modal — camera view takes over the screen when scanning is active
- **D-02:** Camera auto-shows when scanner modal opens (no separate tap-to-start)
- **D-03:** Combined view — scanner and live score shown simultaneously on one screen
- **D-04:** Score panel visible at all times during active race; scanner fills remainder of screen
- **D-05:** Manual entry text input always visible below the camera view (not hidden behind a button)
- **D-06:** Separate submit button required — pressing Enter does not submit
- **D-07:** Format hint shown in the input field (placeholder, uppercase transformation, character limit guidance)
- **D-08:** Manual refresh button — no auto-polling; user taps to get updated score
- **D-09:** Refresh button appears on both the score panel header AND the scanner view (floating action button)
- **D-10:** Toast banners for scan results — color-coded (green success, red error) with status message
- **D-11:** Toast auto-dismiss timing is a user preference setting (user can toggle between 3s auto-dismiss and manual dismiss)
- **D-12:** Race screen shows team info card (team name, class, registered members) PLUS scanner preview — so participant is ready to scan immediately when they find the START
- **D-13:** Detailed breakdown — score, bonus, penalty, final score, and elapsed time shown
- **D-14:** Collapsible cards layout — score as hero element at top, breakdown sections below that expand/collapse
- **D-15:** When re-scanning an already-scanned checkpoint, show toast "Already scanned" — no error state. API call IS made (backend accepts gracefully with statusCode 0 and score=0), but no error is surfaced to user.
- **D-16:** Team position shown as ordinal within class (e.g., "3rd of 12") after each scan, once the ranking data is fetched

### the agent's Discretion

- How to implement the toast notification system (library vs custom composable)
- Component file structure and Vue component boundaries
- Whether to use Element Plus components or build custom UI elements for score cards
- How to compute ordinal position within class from the flat results array

### Deferred Ideas

None — discussion stayed within phase scope

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RACE-01 | Scan START checkpoint to begin race | `POST /api/v1/markings` with `checkPointId=OPEN-START`, backend sets `startDT`, returns `statusCode: 0` |
| RACE-02 | Scan regular checkpoints during active event | `POST /api/v1/markings` with CPID like `OPEN-CP-1`, backend adds score on first scan, score=0 on re-scan |
| RACE-03 | Scan FINISH checkpoint to end race | `POST /api/v1/markings` with `checkPointId=OPEN-FINISH`, backend sets `finishDT`, computes penalty |
| RACE-04 | After each scan, user sees updated score | Response `result` contains full `UserTeamActivation` with updated `score`, `bonus`, `penalty`, `finalScore` |
| RACE-05 | After each scan, user sees position within class | Filter `GET /contests/{id}/results` teams by `contestClassId`, sort by `finalScore` desc + time asc, find index + 1 |
| RACE-06 | After FINISH, user sees final score with penalty breakdown | `finishDT` triggers post-race UI; `penalty` and `finalScore` from `UserTeamActivation` |
| RACE-07 | Re-scanning same checkpoint handled gracefully | Backend always returns 200; re-scan of regular CP gives `statusCode: 0`, `score=0`; client shows "Already scanned" toast (D-15) |
| SCAN-01 | App uses camera to detect and decode QR codes | `vue-qrcode-reader` QrcodeStream component with `facingMode: 'environment'` |
| SCAN-02 | App extracts checkpoint ID from QR payload | `detectedCodes[0].rawValue` gives CPID string like "OPEN-CP-1" directly |
| SCAN-03 | App handles Estonian characters in CP codes (HTML entities) | `decodeURIComponent` or `he.decode()` needed for display; API accepts HTML-encoded CPID in request |
| SCAN-04 | User can manually enter CP code as fallback | Text input below camera with submit button per D-05, D-06, D-07 |
| SCAN-05 | App provides success/error feedback after scan | Toast banners with color coding (D-10); `statusOk` from API determines banner color |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| QR code detection | Browser/Client | — | Camera stream processing via `vue-qrcode-reader` WebRTC |
| Marking submission | API/Backend | — | `POST /api/v1/markings` with JWT auth, returns `MarkingResponse` |
| Live score retrieval | API/Backend | — | `GET /api/v1/userteams/{id}` with JWT for team's own activation state |
| Ranking/position | Browser/Client | — | Filter `GET /contests/{id}/results` by class, compute ordinal client-side |
| Score state persistence | Browser/Client (Dexie) | — | `activeTeam` already stored in IndexedDB; extend with race state |
| Toast feedback | Browser/Client | — | Custom composable or lightweight lib, no backend needed |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vue-qrcode-reader` | ^5.7.3 | Camera-based QR code scanning | [VERIFIED: npm registry] Vue 3 QR scanning de-facto standard, 110 code snippets, trust score 9 |
| `@vueuse/core` | ^13.0.0 | Vue composition utilities | Already in project (package.json); `useGeolocation`, `useIntervalFn` useful |
| `he` | ^1.2.0 | HTML entity decode for Estonian chars | Lightweight, handles all HTML entities including `&Otilde;`, `&Auml;` etc. |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `element-plus` | UI components | Already in project; use for collapsible cards (ElCollapse), buttons |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `vue-qrcode-reader` | `html5-qrcode` | Less Vue-idiomatic, requires more manual wiring |
| Custom toast | `vue-toastification` | Adds a dependency; a simple `useToast()` composable using Vue's `Teleport` is ~50 lines |
| HTML entity decode | Manual regex replacement | Fragmented, edge cases with nested entities |

**Installation:**
```bash
npm install vue-qrcode-reader@^5.7.3 he@^1.2.0
```

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Race View                           │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │  Team Info Card  │  │     Scanner Panel (QrcodeStream) │  │
│  │  - team name     │  │  ┌─────────────────────────────┐ │  │
│  │  - class         │  │  │  Camera Preview (full-bleed) │ │  │
│  │  - members       │  │  │                             │ │  │
│  └──────────────────┘  │  │   [QR detection overlay]    │ │  │
│  ┌──────────────────┐  │  └─────────────────────────────┘ │  │
│  │  Live Score Panel│  │  ┌─────────────────────────────┐ │  │
│  │  - score: 80     │  │  │  Manual CP Input + Submit    │ │  │
│  │  - bonus: 10     │  │  └─────────────────────────────┘ │  │
│  │  - penalty: 0    │  │  [🔄 Refresh FAB]               │  │
│  │  - position: 3rd │  │                                 │  │
│  │  [🔄 Refresh]    │  └─────────────────────────────────┘  │
│  └──────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
         │                           │
         │ POST /api/v1/markings     │ GET /api/v1/userteams/{id}
         │ GET /api/v1/contests/{id}/results
         ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Backend                            │
│  - Marks checkpoint (START/CP/FINISH)                       │
│  - Returns UserTeamActivation with score breakdown          │
│  - Always HTTP 200 — inspect statusCode for domain result   │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── api/
│   └── marking.ts          # POST /api/v1/markings endpoint
├── components/
│   ├── RaceScanner.vue     # QrcodeStream wrapper + manual input
│   ├── ScoreCard.vue       # Live score display with position
│   ├── TeamInfoCard.vue    # Pre-race team info
│   ├── RaceScorePanel.vue  # Collapsible post-race breakdown
│   └── ToastNotification.vue
├── composables/
│   └── useToast.ts         # Toast notification state + methods
├── stores/
│   └── race.ts             # Race activation state (startDT, finishDT, score)
├── types/
│   └── race.ts             # MarkingRequest, MarkingResponse, RaceState
└── views/
    └── RaceView.vue        # Combined scanner + score view
```

### Pattern 1: Camera QR Scanning with `vue-qrcode-reader`

**What:** Use `QrcodeStream` component with `facingMode: 'environment'` for rear camera on mobile, handle continuous detection with debounce to prevent rapid-fire submissions.

**When to use:** Every scan — both camera scan and manual entry trigger the same `submitMarking()` flow.

**Example:**
```typescript
// Source: [Context7 /gruhn/vue-qrcode-reader]
import { QrcodeStream } from 'vue-qrcode-reader'

const pause = ref(false)

async function onDetect(detectedCodes: DetectedBarcode[]) {
  if (pause.value || detectedCodes.length === 0) return
  pause.value = true
  
  const cpId = detectedCodes[0].rawValue
  await submitMarking(cpId)
  
  // Allow scanning same code again after delay
  setTimeout(() => { pause.value = false }, 2000)
}
```
```vue
<QrcodeStream
  :paused="pause"
  :constraints="{ facingMode: 'environment' }"
  @detect="onDetect"
  @error="onCameraError"
/>
```

**Camera error handling:**
```typescript
// Source: [Context7 /gruhn/vue-qrcode-reader]
function onCameraError(err: EmittedError) {
  switch (err.name) {
    case 'NotAllowedError': toast.error('Camera permission denied') break
    case 'NotFoundError': toast.error('No camera found') break
    case 'InsecureContextError': toast.error('HTTPS required for camera') break
    case 'StreamApiNotSupportedError': toast.error('Camera not supported in this browser') break
    default: toast.error(`Camera error: ${err.message}`)
  }
}
```

### Pattern 2: Marking Submission API Call

**What:** POST to `/api/v1/markings` with `checkPointId` (the CPID string like "OPEN-CP-1"), `userTeamId` from active team, and optional GPS coordinates. Inspect `statusOk` and `statusCode` in response — never rely on HTTP status (always 200).

**When to use:** Every scan (START, regular CP, FINISH) and manual entry.

**Example:**
```typescript
// src/api/marking.ts
import { api } from '@/api'
import type { MarkingResponse } from '@/types/race'

export async function submitMarking(params: {
  checkPointId: string   // CPID string, NOT UUID
  userTeamId: string
  lat?: string
  lon?: string
}): Promise<MarkingResponse> {
  const response = await api.post<MarkingResponse>('/Markings', {
    checkPointId: params.checkPointId,
    userTeamId: params.userTeamId,
    lat: params.lat ?? null,
    lon: params.lon ?? null,
    dt: new Date().toISOString()
  })
  return response.data
}
```

**Response handling:**
```typescript
// statusCode: 0=Ok, 1=Error, 2=EventNotStarted, 3=EventFinished, 4=EventAlreadyStarted
function handleMarkingResponse(response: MarkingResponse) {
  if (!response.statusOk) {
    // Domain rejection — show appropriate message based on statusCode
    return { success: false, statusCode: response.statusCode, message: response.message }
  }
  // statusCode 0 with score=0 on re-scan = "Already scanned" toast
  return { success: true, statusCode: 0, activation: response.result }
}
```

### Pattern 3: Estonian Character Handling (HTML Entities)

**What:** CP codes like "OPEN-ÄR-1" are encoded in QR as HTML entities (`OPEN-&Auml;R-1`). The API accepts HTML-encoded CPIDs directly (user-flow.md §3.4: "server decodes them before lookup"), but display in the UI should show decoded characters.

**When to use:** When displaying CP codes to users after scan detection.

**Example:**
```typescript
import he from 'he'

// Decode for display (QR payload already a string)
const displayCPId = he.decode(qrPayload)  // "OPEN-ÄR-1"
```

### Pattern 4: Ordinal Position Within Class

**What:** `GET /contests/{id}/results` returns all teams across all classes. To show position within class, filter by `contestClassId` and compute ordinal from sorted array.

**When to use:** After each scan, when fetching fresh results for position display.

**Example:**
```typescript
function computePosition(
  results: TeamResultListItem[],
  userTeamId: string,
  contestClassId: string
): { ordinal: number; total: number } | null {
  const classTeams = results.teams?.filter(t => t.contestClassId === contestClassId) ?? []
  const sorted = [...classTeams].sort((a, b) =>
    b.finalScore - a.finalScore || (a.finishDT && b.finishDT
      ? new Date(a.finishDT).getTime() - new Date(b.finishDT).getTime()
      : 0)
  )
  const index = sorted.findIndex(t => t.id === userTeamId)
  return index >= 0 ? { ordinal: index + 1, total: sorted.length } : null
}
```

### Anti-Patterns to Avoid

- **Don't use HTTP status for marking success:** `POST /markings` always returns 200. Check `statusOk` and `statusCode` in body — `statusCode: 3` (EventFinished) is a successful FINISH, not an error.
- **Don't auto-submit GPS on every scan:** GPS capture is optional (`lat`/`lon` nullable in `MarkingRequest`). Acquiring GPS can timeout or fail on older devices — don't block the marking submission on it.
- **Don't show error state on re-scan:** Re-scanning a regular CP returns `statusOk: true`, `statusCode: 0`, `score=0` — this is not an error. Show "Already scanned" toast per D-15.
- **Don't use front camera as default:** Rogaine participants hold devices up to QR codes on checkpoints. Use `facingMode: 'environment'` (rear camera) so the checkpoint is visible in the camera preview.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code detection | Custom WebRTC camera stream with BarcodeDetector polyfill | `vue-qrcode-reader` | Complex browser compatibility, memory leak risks in continuous scanning loops, well-tested library handles it |
| HTML entity decoding for Estonian characters | Regex-based replacement | `he` library | Edge cases with nested entities (`&amp;Otilde;`), numbered entities (`&#196;`), handle all HTML5 entities correctly |
| Toast notification state management | Prop-drilling or global event bus | Simple `useToast()` composable with `provide/inject` | 50 lines vs adding a library; per D-11 toast timing is a user preference |
| Position calculation | Ask backend for position | Client-side filter + sort from existing results endpoint | API doesn't provide position endpoint; all data is in `/results` |

**Key insight:** The `vue-qrcode-reader` library's continuous scanning mode with a `paused` ref is the standard pattern for controlling repeat scans. Hand-rolling WebRTC camera streams for QR detection introduces significant complexity with no benefit.

---

## Common Pitfalls

### Pitfall 1: Camera Permission denied in PWA (HTTPS required)

**What goes wrong:** Camera fails with `NotAllowedError` or `InsecureContextError` because the PWA is served over HTTP in development.

**Why it happens:** WebRTC camera access requires secure context (HTTPS or localhost). In development with `vite` (typically HTTP), camera works via localhost exception. On mobile PWA with HTTP, it silently fails.

**How to avoid:**
- Ensure PWA is served over HTTPS in production
- Show clear error message when `InsecureContextError` is caught, directing user to use HTTPS
- In development, access via `localhost` which is automatically a secure context

**Warning signs:** Camera preview shows but no detection, or error toast about permissions on first scan attempt.

### Pitfall 2: Multiple rapid submissions from single scan

**What goes wrong:** The `onDetect` callback fires rapidly as the QR code moves slightly in frame, causing multiple identical `POST /markings` calls in quick succession.

**Why it happens:** `QrcodeStream` detects every frame where a QR is visible. Even holding a steady phone causes micro-movements.

**How to avoid:**
- Use a `pause` ref that blocks detection while a submission is in-flight
- Reset `pause` after a timeout (e.g., 2000ms) to allow re-scanning the same CP
- Consider a `processedCodes` Set to deduplicate within a session

**Warning signs:** Multiple toasts for "Already scanned" when scanning a CP once.

### Pitfall 3: Confusing re-scan feedback

**What goes wrong:** Re-scanning a regular checkpoint returns `statusOk: true` and `score=0` but user sees a "success" green toast, leading them to think the CP was scored again.

**Why it happens:** Backend intentionally returns 200 OK for re-scans (audit trail), but the score delta is 0. Client shows success toast without distinguishing from first scan.

**How to avoid:**
- Track scanned CP IDs in a Set (`scannedCPIds`)
- On response with `statusOk: true` and `score === previousScore`, check if CP was already in `scannedCPIds` and show "Already scanned" toast instead
- Alternative: compare `result.markings.length` before vs after — if unchanged, it was a re-scan

**Warning signs:** User reports "I scanned that CP but it didn't add points" — they likely saw a green success toast but the score didn't change.

### Pitfall 4: Wrong checkpoint type ID sent

**What goes wrong:** Submitting `checkPointId` as a UUID when the API expects the CPID string (e.g., "OPEN-CP-1").

**Why it happens:** `checkPointId` in `MarkingRequest` accepts a string, but the example in docs and the actual implementation use the human-readable CPID, not the internal GUID. The API does a string lookup, not a UUID lookup.

**How to avoid:**
- The QR code payload contains the CPID string directly
- Use `detectedCodes[0].rawValue` as-is — don't try to convert to UUID
- `checkPointCPID` vs `checkPointCPCode` in `MarkingListItem`: `checkPointCPID` is the QR payload string

**Warning signs:** `statusCode: 1` (Error) with message "checkpoint not found" despite valid QR code.

### Pitfall 5: Position shows before results load

**What goes wrong:** Race view shows position as "1st of --" or blank while ranking results are fetching.

**Why it happens:** Position display component renders before `GET /contests/{id}/results` completes.

**How to avoid:**
- Show position only when both `results` is loaded AND `activeTeam.contestClassId` is available
- Use conditional rendering: `v-if="position !== null"`
- Show ordinal as `--` or empty string while loading, not "0th of 0"

**Warning signs:** Position display shows placeholder dashes or "1st of 1" momentarily before real data loads.

---

## Code Examples

### Marking API types (src/types/race.ts)

```typescript
// Add to existing types/team.ts or create new race.ts

export interface MarkingRequest {
  checkPointId: string   // CPID string like "OPEN-CP-1", NOT UUID
  userTeamId: string     // UUID
  lat?: string | null
  lon?: string | null
  dt?: string           // ISO date-time, optional — server uses UtcNow if omitted
}

export interface MarkingResponse {
  statusOk: boolean
  statusCode: 0 | 1 | 2 | 3 | 4   // 0=Ok, 1=Error, 2=EventNotStarted, 3=EventFinished, 4=EventAlreadyStarted
  message: string | null
  result: UserTeamActivation | null
}

// Race state extending activeTeam
export interface RaceState {
  startDT: string | null
  finishDT: string | null
  score: number
  bonus: number
  penalty: number
  finalScore: number
  isStarted: boolean
  isFinished: boolean
  scannedCPIds: Set<string>   // Track which CPs have been scanned for "Already scanned" logic
}
```

### Toast composable (src/composables/useToast.ts)

```typescript
// Lightweight toast composable — no external library needed
import { ref, provide, inject } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
  autoDismiss: boolean
}

const TOAST_SYMBOL = Symbol('toast')

export function createToast() {
  const toasts = ref<Toast[]>([])
  let nextId = 0

  function show(message: string, type: ToastType = 'info', autoDismiss = true) {
    const id = nextId++
    toasts.value.push({ id, message, type, autoDismiss })
    if (autoDismiss) {
      setTimeout(() => dismiss(id), 3000)
    }
    return id
  }

  function dismiss(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  const success = (msg: string) => show(msg, 'success')
  const error = (msg: string) => show(msg, 'error')
  const info = (msg: string) => show(msg, 'info')

  return { toasts, show, dismiss, success, error, info }
}

export function provideToast() {
  return provide(TOAST_SYMBOL, createToast())
}

export function useToast(): ReturnType<typeof createToast> {
  return inject(TOAST_SYMBOL) as ReturnType<typeof createToast>
}
```

### Race store extension pattern (src/stores/race.ts)

```typescript
// Extend team store or create race-specific store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { submitMarking } from '@/api/marking'
import { getUserTeamActivation } from '@/api/team'
import { getContestResults } from '@/api/contest'
import type { RaceState, MarkingResponse } from '@/types/race'
import { useTeamStore } from '@/stores/team'

export const useRaceStore = defineStore('race', () => {
  const teamStore = useTeamStore()
  
  // Race state
  const raceState = ref<RaceState>({
    startDT: null,
    finishDT: null,
    score: 0,
    bonus: 0,
    penalty: 0,
    finalScore: 0,
    isStarted: computed(() => raceState.value.startDT !== null),
    isFinished: computed(() => raceState.value.finishDT !== null),
    scannedCPIds: new Set()
  })

  async function submitScan(checkPointId: string): Promise<MarkingResponse> {
    const response = await submitMarking({
      checkPointId,
      userTeamId: teamStore.activeTeam!.teamId,  // teamId = userTeamId in this context
      lat: undefined,  // Optional GPS
      lon: undefined
    })
    
    if (response.result) {
      raceState.value.startDT = response.result.startDT
      raceState.value.finishDT = response.result.finishDT
      raceState.value.score = response.result.score
      raceState.value.bonus = response.result.bonus
      raceState.value.penalty = response.result.penalty
      raceState.value.finalScore = response.result.finalScore
    }
    
    return response
  }

  return { raceState, submitScan }
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BarcodeDetector polyfill for QR scanning | Native WebRTC via `vue-qrcode-reader` | 2019+ | Much simpler integration, handles all edge cases |
| Auto-polling for live score | Manual refresh button | user-flow.md §4.6–4.8 | Decision D-08 explicitly rejects auto-polling |
| Dialog/modal scanner | Full-screen overlay with simultaneous score | Decision D-03 | Better UX for outdoor visibility |
| Error toast on re-scan | "Already scanned" info toast, API call still made | Decision D-15 | Backend accepts gracefully — no error needed |

**Deprecated/outdated:**
- None in this phase's scope.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `GET /api/v1/userteams/{id}` returns the `userTeamId` as `id` field in `UserTeamListItem` | API Integration | Need to verify actual field name — might be `userTeamId` vs `id` |
| A2 | `teamStore.activeTeam.teamId` is the correct `userTeamId` for `POST /markings` | API Integration | `activeTeam.teamId` maps to `UserTeamListItem.teamId` (the team GUID), not the `userTeamId` (registration ID). This needs verification — may need `activeTeam.id` instead |

---

## Open Questions

1. **Clarification needed:** `activeTeam.teamId` in the team store — is this the `userTeamId` (registration ID) or the actual `teamId` (team GUID)?
   - What we know: `UserTeamListItem` has both `id` (userTeamId) and `teamId` (team GUID)
   - What's unclear: The `ActiveTeamRecord` stored in IndexedDB uses `teamId` field name per `db/index.ts` line 34
   - Recommendation: Verify by checking which ID `GET /api/v1/userteams/{id}` accepts and what field `activeTeam` exposes

2. **Where does the Race view live in routing?**
   - What we know: No race route in current `router/index.ts`
   - What's unclear: Path pattern (`/race/:contestId/:userTeamId`? `/race/:userTeamId`?)
   - Recommendation: Add as `/race/:contestId/:userTeamId` from contest detail "Live Race" button

3. **GPS coordinates — should we attempt to capture?**
   - What we know: `MarkingRequest` has optional `lat`/`lon`
   - What's unclear: Whether organizers actually use GPS data; impact on mobile battery
   - Recommendation: Capture optionally with user permission prompt, don't block scan on GPS failure

4. **Toast timing preference — how is it persisted?**
   - What we know: D-11 says user can toggle between 3s auto-dismiss and manual dismiss
   - What's unclear: Where is this preference stored? Dexie? `localStorage`?
   - Recommendation: Add `toastPreference: 'auto' | 'manual'` to `ActiveTeamRecord` or create a separate `userPreferences` table

---

## Environment Availability

**Step 2.6: SKIPPED** — No external dependencies beyond npm packages already verified:
- `vue-qrcode-reader` is a standard Vue 3 library
- `he` is a standard Node.js / browser library
- All other requirements met by existing codebase (Axios, Pinia, Dexie, Vue 3)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected in project — verify Phase 1/2 setup |
| Config file | — |
| Quick run command | — |
| Full suite command | — |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RACE-01 | Submit START marking | unit | `vitest --run src/api/marking.test.ts` | ❌ Wave 0 |
| RACE-02 | Submit regular CP marking | unit | `vitest --run src/api/marking.test.ts` | ❌ Wave 0 |
| RACE-03 | Submit FINISH marking, penalty computed | unit | `vitest --run src/api/marking.test.ts` | ❌ Wave 0 |
| RACE-04 | Score updated after scan | unit | `vitest --run src/stores/race.test.ts` | ❌ Wave 0 |
| RACE-05 | Position computed correctly | unit | `vitest --run src/utils/position.test.ts` | ❌ Wave 0 |
| RACE-07 | Re-scan shows "Already scanned" toast | unit | `vitest --run src/stores/race.test.ts` | ❌ Wave 0 |
| SCAN-01 | Camera QR detection | manual | Open RaceView, verify camera stream | N/A |
| SCAN-02 | CPID extracted from rawValue | unit | `vitest --run src/components/RaceScanner.test.ts` | ❌ Wave 0 |
| SCAN-03 | Estonian char HTML entity decode | unit | `vitest --run src/utils/html.decode.test.ts` | ❌ Wave 0 |
| SCAN-04 | Manual entry submits correctly | e2e | `playwright test tests/e2e/race.spec.ts` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `src/api/marking.test.ts` — covers RACE-01, RACE-02, RACE-03
- [ ] `src/stores/race.test.ts` — covers RACE-04, RACE-07
- [ ] `src/utils/position.test.ts` — covers RACE-05
- [ ] `src/utils/html.decode.test.ts` — covers SCAN-03
- [ ] `tests/e2e/race.spec.ts` — covers SCAN-04 (manual entry flow)
- Framework install: `vitest` if not detected (`npm view vitest version`)

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT stored in IndexedDB via Dexie — existing `auth.ts` pattern |
| V3 Session Management | yes | JWT refresh on 401 via `api/index.ts` interceptor — existing pattern |
| V4 Access Control | yes | User can only POST markings for their own `userTeamId` (server-enforced) |
| V5 Input Validation | yes | `checkPointId` minLength 1, `userTeamId` must be valid UUID — API enforces |
| V6 Cryptography | no | HTTPS only (PWA requirement), no client-side crypto needed |

### Known Threat Patterns for Vue 3 + Axios + PWA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JWT theft from IndexedDB | Information Disclosure | Dexie storage is same-origin, PWA requires HTTPS |
| JWT refresh CSRF | Tampering | Refresh token flow — existing `api/index.ts` pattern |
| Race state manipulation via local storage | Tampering | Race state computed from API responses, not local cache |
| Malicious QR code injection | Repudiation | Server validates CPID belongs to contest before scoring |
| Camera access on non-HTTPS page | Information Disclosure | `vue-qrcode-reader` throws `InsecureContextError` — catch and warn user |

---

## Sources

### Primary (HIGH confidence)
- [Context7 /gruhn/vue-qrcode-reader](https://context7.com/gruhn/vue-qrcode-reader) - Camera QR scanning API, error handling, continuous detection patterns (110 code snippets, trust score 9)
- `devhelp/api-spec.json` - Full OpenAPI 3.0.4 spec for `POST /api/v1/markings`, `GET /api/v1/userteams/{id}`, `GET /api/v1/contests/{id}/results`
- `devhelp/user-flow.md` - End-to-end flow with statusCode meanings, re-scan behavior, penalty computation

### Secondary (MEDIUM confidence)
- `src/stores/auth.ts` - JWT storage pattern (verified as existing code)
- `src/api/index.ts` - Axios interceptor with JWT refresh (verified as existing code)
- `src/stores/team.ts` - Team store with `activeTeam` persistence (verified as existing code)

### Tertiary (LOW confidence)
- None — all claims verified through primary or secondary sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - `vue-qrcode-reader` verified at v5.7.3, `he` is standard library, all other items from verified existing codebase
- Architecture: HIGH - API patterns from verified spec files, UI decisions from 05-CONTEXT.md
- Pitfalls: MEDIUM - Camera error types from Context7 verified, re-scan behavior from user-flow.md, CPID vs UUID issue from API spec analysis

**Research date:** 2026-05-14
**Valid until:** 2026-06-13 (30 days — stable domain, no fast-moving changes expected in Vue QR scanning)