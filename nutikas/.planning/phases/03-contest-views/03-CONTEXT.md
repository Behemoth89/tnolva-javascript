# Phase 3: Contest Views - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Public contest browsing, details viewing, results viewing, and team detail viewing — all accessible without authentication.
</domain>

<decisions>
## Implementation Decisions

### Contest List Layout
- **D-01:** Card layout for the contests list page. Visual hierarchy with contest name, dates, and status badge. Mobile-first presentation.

### Results Organization
- **D-02:** Results displayed as a single ranked table with class filter tabs. All teams in one view, user switches between classes via tabs. Simpler navigation than separate sections per class.

### In-Progress Contest Handling
- **D-03:** Show empty state with message when contest has no results yet (still in progress). Clear call to action if applicable.

### Team Detail Page
- **D-04:** Score-focused summary. Show member names, class, start/finish times, final score, and penalty breakdown. Standard results view, checkpoint route is not the priority.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Specification
- `devhelp/api-spec.json` — Full OpenAPI 3.0.4 specification for all endpoints
- `devhelp/user-flow.md` — End-to-end flow documentation

### Project Context
- `.planning/ROADMAP.md` §Phase 3 — Phase goals, requirements (CONT-01 to CONT-04), and success criteria
- `.planning/REQUIREMENTS.md` — All requirements including CONT-01 through CONT-04
- `.planning/PROJECT.md` §API Conventions — Must read before implementing API-related code

</canonical_refs>

<existing_code>
## Existing Code Insights

### Reusable Assets
- `src/stores/auth.ts` — Pinia store with IndexedDB persistence via Dexie. Pattern to follow for new stores.
- `src/api/index.ts` — Axios instance with JWT injection. Pattern for API client setup.
- `src/router/index.ts` — Vue Router with auth guards. New contest routes will integrate here.

### Established Patterns
- Pinia stores with Dexie for persistence
- Axios-based API client with typed endpoints
- Vue Router with component-level code splitting
- `meta.guestOnly` and `meta.requiresAuth` patterns for route guards

### Integration Points
- Router: Add `/contests` (list), `/contests/:id` (details), `/contests/:id/results`, `/contests/:contestId/teams/:teamId`
- API client: Add contest-related typed fetch functions
- Auth store: Not required for these public views (no auth needed)

</existing_code>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-Contest Views*
*Context gathered: 2026-05-13*