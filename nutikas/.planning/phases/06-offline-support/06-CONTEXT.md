# Phase 6: Offline Support - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Queue markings when offline, sync when back online, show offline indicator and pending sync count. Building on Phase 5's race participation (QR scanning, live score, position tracking).
</domain>

<decisions>
## Implementation Decisions

### Queue Storage Schema
- **D-01:** Extended marking record with metadata — store: checkPointId, userTeamId, lat, lon, dt, retryCount, lastError, createdAt, synced (boolean flag)
- **D-02:** retryCount tracks sync attempts; lastError stores the most recent error message for debugging

### Sync Strategy
- **D-03:** Auto-sync on reconnect — when navigator.onLine fires true, automatically process the queue
- **D-04:** On partial failure (some markings succeed, some fail): retry failed ones, continue with successful ones
- **D-05:** After max retries (configurable, default 3), mark entry as failed and continue — don't block queue processing

### Offline Indicator UI
- **D-06:** Header badge — small colored badge in the app header area, visible on all screens
- **D-07:** Badge shows "offline" state (e.g., red/orange dot or icon) plus pending count in parentheses: "● 3" when offline with 3 pending
- **D-08:** Use navigator.onLine for detection + window 'online'/'offline' event listeners for reactivity

### Pending Count Display
- **D-09:** Pending count displayed in the offline indicator badge — when offline with pending markings, badge shows the count
- **D-10:** Badge format: icon + "(N)" where N is pending count. E.g., cloud-off icon with "(3)" means 3 pending syncs

### Scan-While-Offline Behavior
- **D-11:** Scan button works even when offline — if offline, marking is queued to IndexedDB automatically
- **D-12:** User sees toast feedback: "Marking queued (offline)" when queuing while offline
- **D-13:** When back online and sync completes, user sees "N markings synced" confirmation toast

### Carried Forward from Phase 5
- **D-14:** Toast banners for scan feedback — green success, red error (per D-10/D-11 in Phase 5)
- **D-15:** Score panel visible at all times during active race — offline indicator integrates with score panel header
- **D-16:** useRaceStore already tracks scannedCPIds — the offline queue extends this with persistence

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API & Race Flow
- `devhelp/api-spec.json` — Full OpenAPI spec. Marking submission: POST /api/v1/Markings
- `devhelp/user-flow.md` — Marking submission contract, scan behavior (§4.6–4.8)

### Frontend Architecture
- `src/db/index.ts` — NutikasAuth Dexie class — extend with pendingMarkings table
- `src/stores/race.ts` — useRaceStore — already tracks scannedCPIds, extend with queue operations
- `src/api/marking.ts` — submitMarking API call — use same pattern for sync

### Prior Phase Context
- `.planning/phases/05-race-participation/05-CONTEXT.md` — Phase 5 decisions (toast feedback, score panel, scanner modal)
- `.planning/phases/04-team-registration/04-CONTEXT.md` — Dexie extension pattern, activeTeam persistence

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NutikasAuth` class in `src/db/index.ts` — extend with `pendingMarkings` table (version 3 migration)
- `useRaceStore` (`src/stores/race.ts`) — has submitScan, loadRaceState, resetRace — extend with queue operations
- `useToast` composable — toast feedback for offline queuing confirmation (reuse from Phase 5 scan feedback)
- RaceScanner component — scan button that calls raceStore.submitScan — extend to check online status and queue

### Established Patterns
- Pinia stores with Dexie-backed persistence
- Toast banners for user feedback (color-coded success/error)
- Reactive composables (useToast, useAuth) — create useOffline composable following same pattern

### Integration Points
- RaceView: show offline indicator badge in header area
- ScoreCard: show pending count if any pending markings exist
- RaceScanner: detect offline, queue instead of API call when offline
- Sync on window 'online' event — listen to browser connectivity changes

</code_context>

<specifics>
## Specific Ideas

- Offline badge: use cloud-off icon from a library like Material Icons or Heroicons
- Toast for queued offline marking: "Marking queued" with info color (not green/red)
- Sync completion toast: "2 markings synced" with success color

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 6-Offline Support*
*Context gathered: 2026-05-14*