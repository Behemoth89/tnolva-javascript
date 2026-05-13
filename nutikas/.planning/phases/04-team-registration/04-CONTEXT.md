# Phase 4: Team Registration - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Authenticated users can register a team for a contest (with name, members, class) and view their registered teams. The active team is stored for Phase 5 race participation resumption.

</domain>

<decisions>
## Implementation Decisions

### Registration Form UX
- **D-01:** Registration form is a **modal/dialog** overlay on ContestDetailView — stays in context, lighter feel
- **D-02:** Class selection via **radio buttons** (single select) — easier on mobile, shows all options at once
- **D-03:** Team members entered as **single comma-separated text field** — simple: "John, Jane, Bob"
- **D-04:** Validation errors shown **inline per-field** with error text below each field
- **D-05:** On success: **toast notification + modal closes** — user stays in context

### My Teams View
- **D-06:** My Teams is a **separate route** `/contests/:id/my-teams` — cleaner separation from contest detail
- **D-07:** My Teams list uses **simple list (card or row)** — team name + class + status visible
- **D-08:** Tapping a team shows **expandable inline details** — no navigation away, markings/score visible inline

### Active Team Persistence
- **D-09:** Active team stored in **IndexedDB via Dexie** (same storage as auth tokens) — survives page refresh, consistent with existing persistence approach
- **D-10:** Active team requires **explicit user selection** — user explicitly marks which team is active for racing

### the agent's Discretion
- Form field labels and placeholder text — agent uses standard conventions
- Toast notification styling — match existing UI patterns
- List item visual design (card vs row) — agent picks based on mobile UX best practices
- Expandable animation and interaction details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API
- `devhelp/api-spec.json` — Full OpenAPI spec. Key endpoints for this phase:
  - `POST /api/v1/Contests/{contestId}/teams` (TeamRegistrationRequest) — team registration
  - `GET /api/v1/Contests/{contestId}/userteams` (UserTeamListItem[]) — user's teams for a contest
  - `GET /api/v1/UserTeams/{id}` (UserTeamActivation) — team activation detail

### Auth
- `src/stores/auth.ts` — Auth store pattern (JWT in IndexedDB via Dexie, `db.auth` table)

### Database
- `src/db/index.ts` — Dexie database setup — add `activeTeam` table here for D-09

### Routing
- `src/router/index.ts` — Vue Router setup with `beforeEach` auth guard

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useContestStore` (`src/stores/contest.ts`) — Pinia store for contest data, fetchers already defined
- `useAuthStore` (`src/stores/auth.ts`) — Pattern to follow for IndexedDB persistence
- `db` (Dexie instance from `src/db/index.ts`) — Extend with `activeTeam` table

### Established Patterns
- Pinia stores with composable pattern (`useXxxStore`)
- IndexedDB persistence via Dexie (same pattern as auth tokens)
- Modal-based forms (no existing modal, but ContestDetailView has inline action buttons)
- Inline error display (ContestDetailView uses `v-if/v-else-if/v-else` for state)

### Integration Points
- ContestDetailView `goToRegister()` pushes to `/contests/${id}/register` — route already exists
- Registration success → toast → close modal → team available via `GET /userteams`
- My Teams route `/contests/:id/my-teams` needs new route and view component
- Phase 5 will read `activeTeam` from IndexedDB to pre-select team for race

</code_context>

<specifics>
## Specific Ideas

- Registration modal should feel lightweight — not a full page navigation
- Radio buttons for class: show class name + duration (e.g., "2h Ultra (120 min)")
- My Teams expandable: on tap, expand to show start time, finish time, final score if available
- Active team selection UI: explicit "Set as active" button in the expanded team detail

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 4-Team Registration*
*Context gathered: 2026-05-13*