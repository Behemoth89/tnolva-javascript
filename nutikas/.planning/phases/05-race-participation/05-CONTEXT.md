# Phase 5: Race Participation - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

QR scanning and live scoring during an active rogaine event. Participants scan START to begin, scan checkpoints during the event, scan FINISH to end, and see updated score/position after each scan.
</domain>

<decisions>
## Implementation Decisions

### Scanner UI
- **D-01:** Full-screen scanner modal — camera view takes over the screen when scanning is active
- **D-02:** Camera auto-shows when scanner modal opens (no separate tap-to-start)

### Race View Layout
- **D-03:** Combined view — scanner and live score shown simultaneously on one screen
- **D-04:** Score panel visible at all times during active race; scanner fills remainder of screen

### Manual CP Entry
- **D-05:** Manual entry text input always visible below the camera view (not hidden behind a button)
- **D-06:** Separate submit button required — pressing Enter does not submit
- **D-07:** Format hint shown in the input field (placeholder, uppercase transformation, character limit guidance)

### Live Score Refresh
- **D-08:** Manual refresh button — no auto-polling; user taps to get updated score
- **D-09:** Refresh button appears on both the score panel header AND the scanner view (floating action button)

### Scan Feedback
- **D-10:** Toast banners for scan results — color-coded (green success, red error) with status message
- **D-11:** Toast auto-dismiss timing is a user preference setting (user can toggle between 3s auto-dismiss and manual dismiss)

### Pre-Race State (before START scan)
- **D-12:** Race screen shows team info card (team name, class, registered members) PLUS scanner preview — so participant is ready to scan immediately when they find the START

### Post-Race Summary (after FINISH scan)
- **D-13:** Detailed breakdown — score, bonus, penalty, final score, and elapsed time shown
- **D-14:** Collapsible cards layout — score as hero element at top, breakdown sections below that expand/collapse

### Re-scan Handling
- **D-15:** When re-scanning an already-scanned checkpoint, show toast "Already scanned" — no error state. API call IS made (backend accepts gracefully with statusCode 0 and score=0 per user-flow.md §4.7), but no error is surfaced to user.

### Position Display
- **D-16:** Team position shown as ordinal within class (e.g., "3rd of 12") after each scan, once the ranking data is fetched

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API & User Flow
- `devhelp/api-spec.json` — Full OpenAPI 3.0.4 specification for marking submission and user team activation endpoints
- `devhelp/user-flow.md` — Complete end-to-end flow documentation (Sections 3.4, 4.6–4.8 define the marking submission contract and race flow)
  - §3.4: Marking submission request/response shape, statusCode meanings
  - §4.6: START scan behavior (sets startDT, EventAlreadyStarted on duplicate)
  - §4.7: Regular CP scan behavior (score=0 on re-scan, bonus window)
  - §4.8: FINISH scan behavior (sets finishDT, computes penalty, statusCode 3)
  - §4.9: Live ranking via GET /contests/{id}/results

### Frontend Architecture
- `src/stores/auth.ts` — Auth store pattern (JWT handling, Dexie persistence) — reuse for team activation state
- `src/api/index.ts` — Axios instance with JWT interceptor and 401 refresh — extend for marking POST
- `src/db/index.ts` — Dexie schema for NutikasAuth — extend with pendingMarkings table for Phase 6
- `src/stores/team.ts` — Existing team store — extend with race activation state (startDT, finishDT, score)

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `useAuth` composable: Auth pattern already established — reuse token access pattern for race API calls
- `stores/auth.ts`: Pinia store with Dexie persistence — same pattern for storing active userTeamId
- `api/index.ts`: Axios with JWT interceptor — marking POST needs same Authorization header injection
- `db/index.ts`: Dexie NutikasAuth class — already has version 2 with activeTeam table defined

### Established Patterns
- Vue 3 Composition API throughout
- Pinia stores with Dexie-backed persistence
- TypeScript interfaces for API types (see src/types/api.ts, src/types/contest.ts, src/types/team.ts)
- Toast/notification approach — no existing toast component found; may need to create one or use a lightweight library

### Integration Points
- Race view likely under `/race` or `/race/:contestId/:userTeamId` route — needs router guard for authenticated access
- Team activation polling via `GET /api/v1/userteams/{id}` with JWT — same pattern as contest API calls
- Rankings from `GET /api/v1/contests/{id}/results` — public endpoint, no auth needed
- Marking submission `POST /api/v1/markings` — authenticated, needs JWT

</codebase_context>

<specifics>
## Specific Ideas

- Post-race collapsible cards should mirror existing card component style (shadow, rounded corners) for visual consistency
- Toast banners should use color coding: green for success (statusOk + statusCode 0), red for errors, existing app color tokens
- Manual entry input placeholder: "e.g. OPEN-CP-1" with uppercase transform

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 5-Race Participation*
*Context gathered: 2026-05-14*