# Phase 8: implement-organizer-flow-create-event-classes-checkpoints-qr - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Organizer dashboard for rogaine event management. Organizers can create contests, manage classes, define checkpoints, generate QR codes for printing, and view event results. This is separate from the participant flow but shares the auth system.

</domain>

<decisions>
## Implementation Decisions

### Authorization & Navigation
- **D-01:** Organizer dashboard protected by `organiser` role claim in JWT
- **D-02:** Route guard on `/organizer` checks JWT claim before rendering dashboard
- **D-03:** No separate login — same auth system as participants, role determines access
- **D-04:** Organizer enters via dashboard entry (button in header → full-screen dashboard)
- **D-05:** Organizer sees all contests within their organization (org-scoped via `organisationId`)

### Navigation Flow
- **D-06:** Organizer dashboard is a separate route section (`/organizer`)
- **D-07:** Exit dashboard via logo/home navigation
- **D-08:** From dashboard, organizer can navigate to contest-specific management views

### Dashboard Layout
- **D-09:** Dashboard shows list view of organizer's contests
- **D-10:** List includes: date, name, status (draft/open/closed), actions
- **D-11:** Support all three states: manage existing events, create-first prompt, new organizer empty state with CTA

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Specification
- `devhelp/api-spec.json` — Full OpenAPI 3.0.4 with organiser endpoints (POST /api/v1/organiser/Contests, /contest-classes, /check-points, etc.)
- `devhelp/user-flow.md` — End-to-end flow documentation

### Project Context
- `.planning/PROJECT.md` — Overall project definition (Vue 3 PWA, NestJS backend, offline-first)
- `.planning/REQUIREMENTS.md` — Requirements traceability
- `.planning/ROADMAP.md` — Phase 8 goal definition

### Auth References
- `.opencode/get-shit-done/workflows/discuss-phase/modes/default.md` — Role check flow

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/auth.ts` — Auth store with JWT handling, can be extended for role checking
- `src/composables/useAuth.ts` — Auth composable, extend for role checks
- `src/router/index.ts` — Vue Router, add organizer routes with guards
- `src/components/AppHeader.vue` — Existing header, add organizer nav element

### Established Patterns
- Pinia stores for state management
- Axios for API calls (same pattern as contest API)
- JWT auth with claim checking

### Integration Points
- `/api/v1/organiser/Contests` — List/create contests (GET, POST)
- `/api/v1/organiser/Contests/{id}` — Get/update/delete single contest
- `/api/v1/organiser/contests/{contestId}/contest-classes` — Class management
- `/api/v1/organiser/contests/{contestId}/check-points` — Checkpoint management
- `/api/v1/organiser/contests/{contestId}/markings` — View all markings
- `src/api/index.ts` — API client structure to follow

</codebase_context>

<specifics>
## Specific Ideas

- Role provisioning: organiser role is assigned by system administrator (e.g. via seeded `organiser@taltech.ee` account or via `Areas/UserAdmin`)
- Org-scoped contest filtering: backend returns contests filtered by the organizer's `organisationId` — organizer sees all events within their organization, not just ones they personally created

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

---

*Phase: 8-implement-organizer-flow-create-event-classes-checkpoints-qr*
*Context gathered: 2026-05-21*