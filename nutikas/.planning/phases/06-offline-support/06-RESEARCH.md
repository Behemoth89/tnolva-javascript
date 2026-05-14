# Phase 6: Offline Support - Research

**Researched:** 2026-05-14
**Domain:** Offline-first queue management with browser IndexedDB persistence and automatic sync
**Confidence:** HIGH

## Summary

Phase 6 implements offline marking queue for the Nutikas Rogaine mobile app. When participants scan checkpoints without connectivity, markings are persisted to IndexedDB via Dexie and automatically synced when the browser regains connectivity. The phase extends the existing Dexie schema (NutikasAuth class), adds a useOffline composable for reactive connectivity detection, a SyncManager for queue processing, and UI indicators for offline state and pending count.

Key libraries: **Dexie 4.4.2** (IndexedDB wrapper, already in package.json), **Pinia** (existing state management), **Vue composables** (useOffline pattern). No new dependencies required.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Queue storage schema:** checkPointId, userTeamId, lat, lon, dt, retryCount, lastError, createdAt, synced (boolean flag)
- **Auto-sync on reconnect:** navigator.onLine event triggers automatic queue processing
- **Partial failure handling:** retry failed markings, continue with successful ones; max retries default 3, then mark failed and continue
- **Offline indicator:** header badge showing "offline" state + pending count "(N)"
- **Badge format:** cloud-off icon + "(N)" where N is pending count

### the agent's Discretion

- Specific icon choice (Material Icons or Heroicons)
- Toast message exact wording ("Marking queued" vs "Queued")
- Whether to use a dedicated composable vs inline logic in RaceScanner

### Deferred Ideas

None — discussion stayed within phase scope

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Offline queue storage | Browser/IndexedDB | — | Dexie tables store pending markings |
| Online detection | Browser | — | navigator.onLine + window events |
| Queue sync processing | API/Backend | — | POST /api/v1/Markings for each queued item |
| Offline indicator UI | Frontend | — | Vue component in header area |
| Pending count display | Frontend | — | Reactive computed from Dexie query |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Dexie** | 4.4.2 [VERIFIED: npm registry] | IndexedDB wrapper for offline queue | Already in package.json; superior Promise-based API over raw IDB |
| **Pinia** | 2.2.0 [VERIFIED: npm registry] | State management for sync state | Already in use; extend with pendingMarkings count |
| **Vue 3** | 3.5.34 [VERIFIED: npm registry] | Framework | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@vueuse/core** | 13.0.0 [VERIFIED: npm registry] | Utility composables (useOnline) | Consider for online detection shortcut |

**Installation:** No new packages needed — all required packages already in package.json.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   RaceScanner.vue                    │  │
│  │  [Online? ─────────────────────────────> Submit scan │  │
│  │       │                                    │         │  │
│  │       │ OFFLINE                            ▼         │  │
│  │       └──────────────────────────> Add to queue     │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Dexie: NutikasAuth DB                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  pendingMarkings table (version 3)            │  │  │
│  │  │  - checkPointId (indexed)                      │  │  │
│  │  │  - userTeamId                                  │  │  │
│  │  │  - lat, lon, dt                                │  │  │
│  │  │  - retryCount, lastError, createdAt            │  │  │
│  │  │  - synced: boolean (indexed)                   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│                              │ window 'online' event        │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SyncManager (Pinia or composable)         │  │
│  │  - processQueue(): iterate pendingMarkings.where()    │  │
│  │  - For each: submitMarking() → markSynced() on success│  │
│  │  - On failure: increment retryCount, set lastError     │  │
│  │  - Skip if retryCount >= maxRetries (3)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│                    POST /api/v1/Markings                   │
│                              │                              │
│                              ▼                              │
│                      API Backend                           │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── db/
│   └── index.ts           # Extend NutikasAuth with pendingMarkings table (version 3)
├── composables/
│   ├── useOffline.ts      # NEW: navigator.onLine reactive state, pending count
│   └── useSyncManager.ts  # NEW: processQueue, auto-sync on reconnect
├── stores/
│   └── race.ts            # Extend: addToQueue, getPending, markSynced methods
├── components/
│   ├── RaceScanner.vue    # Extend: check online, queue instead of submit if offline
│   └── OfflineIndicator.vue # NEW: cloud-off icon badge with pending count
└── types/
    └── offline.ts         # NEW: PendingMarking interface
```

### Pattern 1: Dexie Version Migration (extend existing schema)

**What:** Extend the NutikasAuth class with a new `pendingMarkings` table in version 3.
**When to use:** Adding a new table to an existing Dexie database with prior versions.

```typescript
// src/db/index.ts — Extend NutikasAuth class
import Dexie, { type Table } from 'dexie'
import type { ActiveTeamRecord } from '@/types/team'
import type { PendingMarking } from '@/types/offline'

export class NutikasAuth extends Dexie {
  auth!: Table<{ key: string; value: string }>
  activeTeam!: Table<ActiveTeamRecord>
  pendingMarkings!: Table<PendingMarking>  // NEW

  constructor() {
    super('NutikasAuth')
    this.version(1).stores({
      auth: 'key'
    })
    this.version(2).stores({
      activeTeam: 'id'
    })
    this.version(3).stores({  // NEW version for pendingMarkings
      pendingMarkings: '++id, checkPointId, userTeamId, synced, createdAt'
    })
  }
}

export const db = new NutikasAuth()
```

**Source:** [VERIFIED: dexie.org/docs/Tutorial/Understanding-the-basics] — "When adding new tables, you only need to specify the new table schemas. Existing tables from previous versions are automatically preserved."

### Pattern 2: Reactive Online Detection Composable

**What:** Provide reactive `isOnline` state and pending count to components.
**When to use:** When components need to react to connectivity changes.

```typescript
// src/composables/useOffline.ts
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '@/db'
import type { PendingMarking } from '@/types/offline'

export function useOffline() {
  const isOnline = ref(navigator.onLine)
  
  const updateOnlineStatus = () => { isOnline.value = navigator.onLine }
  
  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  })
  
  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })
  
  const pendingCount = computed(async () => {
    return await db.pendingMarkings.where('synced').equals(0).count()
  })
  
  return { isOnline, pendingCount }
}
```

### Pattern 3: Sync Manager — Process Queue on Reconnect

**What:** Automatically process pending markings when browser comes back online.
**When to use:** When you need to sync queued items after connectivity is restored.

```typescript
// src/composables/useSyncManager.ts
import { submitMarking } from '@/api/marking'
import { db } from '@/db'
import { useToast } from '@/composables/useToast'

const MAX_RETRIES = 3

export function useSyncManager() {
  const toast = useToast()
  
  async function processQueue(): Promise<number> {
    const pending = await db.pendingMarkings
      .where('synced').equals(0)
      .filter(m => m.retryCount < MAX_RETRIES)
      .toArray()
    
    let syncedCount = 0
    
    for (const marking of pending) {
      try {
        await submitMarking({
          checkPointId: marking.checkPointId,
          userTeamId: marking.userTeamId,
          lat: marking.lat,
          lon: marking.lon,
          dt: marking.dt
        })
        
        // Mark as synced
        await db.pendingMarkings.update(marking.id!, { synced: true })
        syncedCount++
      } catch (err) {
        // Increment retry count
        await db.pendingMarkings.update(marking.id!, {
          retryCount: marking.retryCount + 1,
          lastError: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
    
    return syncedCount
  }
  
  // Auto-sync when coming online
  window.addEventListener('online', async () => {
    const count = await processQueue()
    if (count > 0) {
      toast.success(`${count} marking${count > 1 ? 's' : ''} synced`)
    }
  })
  
  return { processQueue }
}
```

### Pattern 4: RaceScanner — Queue on Offline, Submit when Online

**What:** Check connectivity before attempting API call; queue locally if offline.
**When to use:** When a scan action should work seamlessly across online/offline states.

```typescript
// In RaceScanner.vue or race store
async function submitScan(checkPointId: string, userTeamId: string) {
  if (!navigator.onLine) {
    // Queue locally
    await db.pendingMarkings.add({
      checkPointId,
      userTeamId,
      lat: getCurrentPosition()?.latitude?.toString() ?? null,
      lon: getCurrentPosition()?.longitude?.toString() ?? null,
      dt: new Date().toISOString(),
      retryCount: 0,
      lastError: null,
      createdAt: new Date().toISOString(),
      synced: false
    })
    toast.info('Marking queued (offline)')
    return
  }
  
  // Online — normal submit
  const result = await submitMarking({ checkPointId, userTeamId })
  // ... handle result
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| IndexedDB access | Raw IDB APIs | **Dexie** | Dexie provides Promise-based API, better error handling, schema migrations, and cross-browser compatibility |
| Connectivity detection | XMLHttpRequest HEAD requests | **navigator.onLine + window events** | Browser-native, zero network overhead, instant detection |
| Queue retry logic | setTimeout + manual state | **Dexie where + retryCount** | Dexie queries are indexed; retryCount indexed for efficient filtering |
| Toast feedback | Custom notification divs | **useToast composable** (existing) | Already in codebase; follow established pattern for consistency |

---

## Common Pitfalls

### Pitfall 1: navigator.onLine is not reliable on mobile

**What goes wrong:** `navigator.onLine` returns `true` even when mobile has no actual internet connectivity (just a carrier connection). The browser only goes "offline" when the device truly has no network.

**Why it happens:** The browser's offline detection is based on network interface availability, not actual internet reachability.

**How to avoid:** Consider ping-based verification for critical sync operations. However, for this phase, the context decision specifies using navigator.onLine, so we follow that. SyncManager should handle API failures gracefully and keep items in queue.

**Warning signs:** Items appear to sync but API returns network errors; sync seems to succeed but data doesn't appear server-side.

### Pitfall 2: Race condition between online event and actual connectivity

**What goes wrong:** The `online` event fires when the browser thinks it has connectivity, but actual requests may still fail (e.g., captive portals, flaky connection).

**Why it happens:** `navigator.onLine` only indicates the OS-level network is up, not that HTTP requests will succeed.

**How to avoid:** SyncManager should handle failed API calls with retry logic (retryCount, lastError tracking already in schema). Process queue items one at a time so a single failure doesn't block others.

### Pitfall 3: Forgetting to mark items as synced after successful API call

**What goes wrong:** Successfully synced markings stay in the pending queue, causing duplicate submission on next sync cycle.

**Why it happens:** Easy to miss the `synced: true` update after the API call succeeds.

**How to avoid:** Wrap the markSynced update in the same try block as the API call; use Dexie transactions to ensure atomicity.

### Pitfall 4: IndexedDB quota exceeded with unbounded queue

**What goes wrong:** If a device is offline for days and the user scans many checkpoints, IndexedDB storage could be exceeded.

**Why it happens:** Each pending marking stores full context; no cleanup policy exists.

**How to avoid:** Implement queue pruning: (a) auto-delete synced items older than 7 days, (b) limit queue size (e.g., max 500 pending markings), (c) show warning when pending count exceeds threshold.

### Pitfall 5: Race condition when scan while online but connectivity drops mid-request

**What goes wrong:** User taps scan, request starts, device goes offline, request fails — marking is lost.

**Why it happens:** No atomic "start request, if fails fall back to queue" logic.

**How to avoid:** Wrap the submit call in try-catch; on any exception (network error, timeout, 5xx), fall back to queuing locally. This handles both "offline at start" and "offline mid-request" cases.

---

## Code Examples

### PendingMarking Type Definition

```typescript
// src/types/offline.ts
export interface PendingMarking {
  id?: number              // auto-increment via ++id
  checkPointId: string     // CPID string like "OPEN-CP-1"
  userTeamId: string       // UUID
  lat: string | null       // GPS latitude
  lon: string | null       // GPS longitude
  dt: string               // ISO date-time
  retryCount: number       // sync attempt counter
  lastError: string | null // most recent error message
  createdAt: string        // ISO date-time
  synced: boolean          // true when successfully synced to server
}
```

**Source:** Based on existing MarkingRequest in `src/types/race.ts` plus metadata fields from D-01.

### Dexie Query Patterns

```typescript
// Get all pending (not yet synced) markings
const pending = await db.pendingMarkings.where('synced').equals(0).toArray()

// Get pending markings for a specific user team
const teamPending = await db.pendingMarkings
  .where('userTeamId').equals(userTeamId)
  .and(m => !m.synced)
  .toArray()

// Update synced status
await db.pendingMarkings.update(id, { synced: true })

// Increment retry count on failure
await db.pendingMarkings.update(id, {
  retryCount: existing.retryCount + 1,
  lastError: errorMessage
})

// Count pending
const count = await db.pendingMarkings.where('synced').equals(0).count()
```

**Source:** [VERIFIED: dexie.org/docs/API-Reference] — Table.where(), Collection.filter(), Collection.count()

### Offline Indicator Component

```vue
<!-- src/components/OfflineIndicator.vue -->
<script setup lang="ts">
import { useOffline } from '@/composables/useOffline'

const { isOnline, pendingCount } = useOffline()
</script>

<template>
  <div v-if="!isOnline" class="offline-badge">
    <span class="icon">☁️</span>
    <span v-if="pendingCount > 0" class="count">({{ pendingCount }})</span>
  </div>
</template>

<style scoped>
.offline-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border-radius: 12px;
  font-size: 12px;
}
</style>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage for offline queue | Dexie IndexedDB | Standard modern web | Dexie provides indexed queries, transactions, schema versioning vs localStorage string-only |
| Polling for connectivity | navigator.onLine + events | Standard | Browser-native, no polling overhead |
| Single-shot sync | Queue with retry + partial failure handling | Context D-04 | Items retry individually; success continues, failure records error |

**Deprecated/outdated:**
- None relevant to this phase.

---

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | navigator.onLine is sufficient for this phase's offline detection needs | Common Pitfalls | If mobile reliability is worse than expected, sync may not trigger promptly; could add ping-based verification as fallback |
| A2 | Queued markings should NOT be deleted after sync (keep for audit/debug) | Architecture Patterns | If server expects delete-after-sync, could accumulate stale local data; but context implies idempotent retry is acceptable |
| A3 | IndexedDB storage quota is not a concern for v1 (reasonable number of checkpoints per event) | Common Pitfalls | If events run long with many checkpoints, quota could be hit; should implement pruning in v2 |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Should we show a "syncing..." indicator during queue processing?**
   - What we know: SyncManager processes queue on `online` event; toast shows "N markings synced" on completion.
   - What's unclear: Whether to show a persistent "syncing" badge during the actual HTTP calls.
   - Recommendation: Show ephemeral "Syncing..." state in the OfflineIndicator during processQueue() execution, resolve when complete.

2. **Should failed markings after max retries be shown to the user differently?**
   - What we know: D-05 says mark as failed and continue; retryCount >= 3 skips processing.
   - What's unclear: Whether the user should see a "X markings failed" warning vs silently skipping.
   - Recommendation: Add a failed count to the offline indicator: "☁️ (3, 2 failed)" where 3 pending, 2 permanently failed.

3. **Should we prune synced markings, and if so, on what schedule?**
   - What we know: Context specifies synced flag, not deletion policy.
   - What's unclear: Whether to ever delete old synced records.
   - Recommendation: Implement 7-day auto-prune of synced records in SyncManager as a low-priority background task.

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified — all required packages already in package.json)

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Dexie | Pending markings table | ✓ | 4.4.2 | — |
| Pinia | SyncManager state | ✓ | 2.2.0 | — |
| Vue | Composables, components | ✓ | 3.5.34 | — |
| @vueuse/core | useOnline composable | ✓ | 13.0.0 | Custom navigator.onLine wrapper |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (if installed) or manual testing |
| Config file | none detected — check `vitest.config.ts` |
| Quick run command | `npm run test` (if configured) |
| Full suite command | `npm run test` (if configured) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OFFL-01 | Queue marking when offline | manual | — | Needs new test file |
| OFFL-02 | Queued markings persist | manual | — | Needs new test file |
| OFFL-03 | App syncs on reconnect | manual | — | Needs new test file |
| OFFL-04 | Shows offline indicator | manual | — | Needs new test file |
| OFFL-05 | Shows pending count | manual | — | Needs new test file |

### Sampling Rate
- **Per task commit:** manual review
- **Per wave merge:** manual full-phase test
- **Phase gate:** Full manual test before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/offline.test.ts` — tests for queue, sync, offline indicator
- [ ] `tests/offline-helpers.ts` — test utilities (Dexie test setup, mock navigator.onLine)
- [ ] Framework install: `npm install -D vitest` — if testing framework not present

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Auth already handled in Phase 2; queued markings carry auth via existing JWT interceptor |
| V3 Session Management | No | Session handled in Phase 2 |
| V4 Access Control | No | Markings submitted with userTeamId — server validates ownership |
| V5 Input Validation | Yes | checkPointId from QR code; validate format before queue |
| V6 Cryptography | No | No crypto operations; HTTPS already in transport layer |

### Known Threat Patterns for offline queue

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered queued data (modified before sync) | Tampering | Server-side validation of checkPointId + userTeamId ownership |
| Queue overflow DoS | Denial of Service | IndexedDB quota is browser-enforced; implement max queue size |
| Offline marking spoofing | Elevation of Privilege | Server already rejects markings for non-owned teams |

---

## Sources

### Primary (HIGH confidence)
- [Context7 /websites/dexie] — Dexie 4.x documentation for table schema, versioning, where/filter/toArray operations
- `src/db/index.ts` — Verified existing NutikasAuth pattern, current version 2 schema
- `src/stores/race.ts` — Verified existing useRaceStore, submitScan method signature
- `src/api/marking.ts` — Verified submitMarking API call shape
- `npm view dexie version` — Verified 4.4.2 current version

### Secondary (MEDIUM confidence)
- `devhelp/user-flow.md` — Marking submission contract, status codes, idempotency behavior
- `devhelp/api-spec.json` — POST /api/v1/Markings schema

### Tertiary (LOW confidence)
- None — all critical claims verified via primary sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Dexie, Pinia, Vue already in package.json; verified via npm registry
- Architecture: HIGH — Patterns derived from existing codebase patterns (NutikasAuth class, useToast composable, Pinia stores)
- Pitfalls: HIGH — All pitfalls based on verified Dexie behavior and browser API specs

**Research date:** 2026-05-14
**Valid until:** 2026-07-14 (90 days — IndexedDB patterns are stable)