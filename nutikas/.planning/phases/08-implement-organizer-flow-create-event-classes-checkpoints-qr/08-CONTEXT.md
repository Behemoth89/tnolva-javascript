# Phase 8: implement-organizer-flow-create-event-classes-checkpoints-qr - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Organizer dashboard for rogaine event management — following the `organizer-flow.md` end-to-end path:
1. Auth + org discovery (organisations endpoint)
2. Contest CRUD
3. Class configuration (duration, maxDuration, penalties)
4. Checkpoint configuration + QR code generation
5. Team management (create, add members)
6. Live markings monitoring during event
7. On-behalf marking, corrections
8. Closing (no explicit close — governed by openTo)

</domain>

<decisions>
## Implementation Decisions

### Authorization & Navigation
- **D-01:** JWT auth + `organiser` role claim required for all `/api/v1/organiser/*` endpoints
- **D-02:** Route guard on `/organizer` checks JWT claim before rendering dashboard
- **D-03:** No separate login — same auth system as participants, role determines access
- **D-04:** Dashboard entry from header button → full-screen dashboard
- **D-05:** Exit dashboard via logo/home navigation

### Org & Contest Scoping
- **D-06:** On login, call `GET /api/v1/organiser/organisations` to get organizer's organisations
- **D-07:** Organizer sees all contests within their organization (org-scoped via `organisationId`)

### Dashboard Layout
- **D-08:** Dashboard shows list view of organizer's contests
- **D-09:** List includes: date, name, status, actions
- **D-10:** Support all states: manage existing events, create-first prompt, new organizer empty state with CTA

### Class Configuration
- **D-11:** Class fields: name, orderNr, duration (seconds), maxDuration (seconds), overDurationUnit (seconds), overDurationPenalty (score deducted per unit)

### Checkpoint Configuration
- **D-12:** Checkpoint fields: cpid (QR payload, unique within contest), cpCode (human label for print), checkPointType (1=Regular, 2=Finish, 3=Start, 4=NoScore), score, lat, lon
- **D-13:** QR codes encode the `cpid` string — scanner reads cpid, not the GUID

### Markings & Corrections
- **D-14:** List markings paginated (default 25, max 100), ordered newest-first
- **D-15:** On-behalf marking uses `checkPointId` as GUID (not cpid string)
- **D-16:** Edit/delete raw marking — does NOT recompute team score; manually update team totals afterwards if needed

### Team Management
- **D-18:** Organizer team management is for pre-seeding teams on behalf of participants (for events that don't use self-registration)
- **D-19:** Regular team registration (participants creating teams) is handled in Phase 4 (Team Registration) via `POST /api/v1/contests/{contestId}/teams`
- **D-17:** No explicit "close contest" call — contest closes automatically when `openTo <= now`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Organizer API
- `devhelp/organizer-flow.md` — **PRIMARY reference** — complete end-to-end flow, all endpoints, request/response shapes, validation rules

### Supporting Docs
- `devhelp/api-spec.json` — Full OpenAPI 3.0.4 with organiser endpoints
- `devhelp/user-flow.md` — Participant flow (for context on how markings work)

### Project Context
- `.planning/PROJECT.md` — Vue 3 PWA, NestJS backend, offline-first
- `.planning/REQUIREMENTS.md` — Requirements traceability
- `.planning/ROADMAP.md` — Phase 8 goal definition

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/auth.ts` — Auth store with JWT handling, extend for role checking
- `src/composables/useAuth.ts` — Auth composable
- `src/router/index.ts` — Vue Router, add `/organizer` routes with auth guard
- `src/components/AppHeader.vue` — Add organizer nav element
- `src/api/index.ts` — API client pattern to follow for organiser endpoints

### Integration Points
- `GET /api/v1/organiser/organisations` — List organizer's orgs (first call after login)
- `GET /api/v1/organiser/contests` — List org's contests (dashboard)
- `POST/PUT/DELETE /api/v1/organiser/contests/{id}` — Contest CRUD
- `POST/PUT/DELETE /api/v1/organiser/contests/{contestId}/contest-classes` — Class CRUD
- `POST/PUT/DELETE /api/v1/organiser/contests/{contestId}/check-points` — Checkpoint CRUD
- `GET /api/v1/organiser/contests/{contestId}/check-points` — List checkpoints (for QR generation)
- `POST/PUT/DELETE /api/v1/organiser/teams/{id}` — Team management
- `GET /api/v1/organiser/contests/{contestId}/teams` — List teams
- `GET/POST/DELETE /api/v1/organiser/teams/{teamId}/user-teams` — Team membership
- `GET /api/v1/organiser/contests/{contestId}/markings` — Live markings view
- `POST /api/v1/organiser/teams/{teamId}/markings` — On-behalf marking
- `PUT/DELETE /api/v1/organiser/markings/{id}` — Edit/delete raw marking

</codebase_context>

<specifics>
## Specific Ideas

- Role provisioning: organiser role is assigned by system administrator (e.g. via seeded `organiser@taltech.ee` account or via `Areas/UserAdmin`)
- QR code generation: jsPDF or similar client-side library — one QR per `cpid` value
- Contest deletion: clean up in order — markings → user-teams → teams → checkpoints → classes → contest
- Team registration is participant-driven (Phase 4) — participants register via `POST /api/v1/contests/{contestId}/teams`. Organizer pre-seeding is optional and only for events that need it.

</specifics>

<deferred>
## Deferred Ideas

None — following organizer-flow.md for full scope

---

*Phase: 8-implement-organizer-flow-create-event-classes-checkpoints-qr*
*Context gathered: 2026-05-21*