# Nutikas Rogaine Mobile App

## What This Is

A mobile-first PWA for rogaine (cross-country navigation) events. Participants scan QR-coded checkpoints with their phone camera, compete in teams, and see live scores as they race. Spectators can browse contests and view results without logging in.

## Core Value

Participants complete checkpoints and finish the race with confidence their scores are captured correctly and reflected live.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Participant: Register team for a contest
- [ ] Participant: Scan START to begin race
- [ ] Participant: Scan checkpoint QR codes during event
- [ ] Participant: View live score after each scan
- [ ] Participant: View live position/ranking within class
- [ ] Participant: Scan FINISH to end race
- [ ] Participant: See final score with penalty breakdown
- [ ] Participant: Offline marking queue with sync when online
- [ ] Spectator: Browse visible contests
- [ ] Spectator: View contest details and classes
- [ ] Spectator: View contest results/rankings
- [ ] Spectator: View team detail with marking history
- [ ] Auth: Email/password registration and login
- [ ] Auth: JWT with refresh token, session persists across refresh
- [ ] PWA: Installable, works offline, camera for QR scanning

### Out of Scope

- [Organiser dashboard] — Backend organiser endpoints exist, but v1 frontend focuses on participants and spectators only
- [Push notifications] — Future feature for race updates
- [Multiple device login] — Single session per account in v1
- [OAuth social login] — Email/password sufficient for v1

## API Conventions

**MUST READ before implementing any API-related code.** All agents implementing API features must first read:
- `devhelp/api-spec.json` — Full OpenAPI 3.0.4 specification
- `devhelp/user-flow.md` — End-to-end flow documentation

Key conventions:
- All endpoints return/accept JSON
- Times are ISO 8601 UTC
- Property names use **camelCase** on the wire (e.g., `isOpenForParticipation`, `userTeamId`)

## Context

- Backend: Existing .NET/NestJS API in `nutikas/` directory, exposes `/api/v1/` REST endpoints with JWT authentication
- API spec: `devhelp/api-spec.json` and `devhelp/user-flow.md` document the full participant flow
- Frontend: New Vue 3 PWA in `nutikas/` directory (separate from existing `vue-project/` and `vue-todo-express/` test projects)
- Docker deployment target: Phase 1 goal is working Docker setup

## Constraints

- **Frontend**: Vue 3 (user-specified)
- **Backend**: Connect to existing .NET API (do not build new backend)
- **Mobile**: Must work on mobile browsers, camera access for QR scanning
- **Offline**: Must queue markings when offline, sync when back online
- **Deployment**: Docker container in phase 1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vue 3 PWA | User-specified, mobile-first requirement | — Pending |
| Guest-first auth | Most content (contests, results) is public; login only for team registration and scanning | — Pending |
| Offline marking queue | Rogaine events often in areas with poor coverage; participants must not lose markings | — Pending |
| Real-time scoreboard | Participants need immediate feedback after each scan | — Pending |
| Connect to existing backend | Reuse existing .NET API rather than build new backend | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2025-05-13 after initialization*