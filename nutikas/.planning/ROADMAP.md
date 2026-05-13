# Roadmap: Nutikas Rogaine Mobile App

**Created:** 2025-05-13
**Granularity:** Standard (5-8 phases, 3-5 plans each)

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Foundation | Project scaffold, PWA config, Docker setup | PWA-01, PWA-02, PWA-03, DOCK-01, DOCK-02, DOCK-03 | 5 |
| 2 | Authentication | Login, register, JWT handling, session persistence | AUTH-01 to AUTH-06 | 6 |
| 3 | Contest Views | Browse contests, view details and results | CONT-01 to CONT-04 | 4 |
| 4 | Team Registration | Register team, view own teams | TEAM-01 to TEAM-03 | 3 |
| 5 | Race Participation | QR scanning, live score, position tracking | RACE-01 to RACE-07, SCAN-01 to SCAN-05 | 12 |
| 6 | Offline Support | Marking queue, sync, offline indicator | OFFL-01 to OFFL-05 | 5 |
| 7 | Polish & Deploy | Final integration, GitLab CI/CD | — | — |

---

## Phase 1: Foundation

**Goal:** Set up project scaffold, configure PWA, Docker deployment

### Requirements
- PWA-01: App is installable on mobile home screen
- PWA-02: App works when device is offline
- PWA-03: App shows "update available" prompt
- DOCK-01: Vue app runs in Docker container
- DOCK-02: Container serves app on configured port
- DOCK-03: CORS is configured for API communication

### Plans
- [x] 01-01-PLAN.md — Scaffolding: Vite + Vue 3 + TypeScript, directory structure, ESLint + Prettier
- [x] 01-02-PLAN.md — PWA Configuration: vite-plugin-pwa, PWA icons, service worker, update prompt
- [x] 01-03-PLAN.md — Docker Setup: multi-stage Dockerfile, nginx config, docker-compose
- [x] 01-04-PLAN.md — Walking Skeleton verification: end-to-end dev + Docker verification, SKELETON.md

### Success Criteria
1. App builds without errors
2. App is installable on mobile (manifest valid)
3. App shell loads when offline
4. Docker container runs and serves app
5. API calls reach backend (CORS configured)

---

## Phase 2: Authentication

**Goal:** User registration, login, JWT handling with persistence

### Requirements
- AUTH-01: User can register with email, password, first name, and last name
- AUTH-02: User can log in with email and password
- AUTH-03: User receives JWT on login/registration
- AUTH-04: JWT persists across browser refresh
- AUTH-05: User can log out and tokens are cleared
- AUTH-06: App automatically refreshes JWT when expired

### Plans
- [x] 02-01-PLAN.md — Auth Store: Pinia store with IndexedDB persistence via Dexie
- [x] 02-02-PLAN.md — API Client: Axios instance with JWT injection and 401 refresh (TDD)
- [x] 02-03-PLAN.md — Auth Endpoints: Typed API calls and useAuth composable
- [x] 02-04-PLAN.md — Auth Views: Login/Register components, router guards

### Success Criteria
1. User can register and receives JWT
2. User can log in and receives JWT
3. JWT persists across browser refresh
4. User can log out and tokens are cleared
5. Expired JWT is silently refreshed
6. Protected routes redirect to login

---

## Phase 3: Contest Views

**Goal:** Public contest browsing, details, and results

### Requirements
- CONT-01: User can browse visible contests without logging in
- CONT-02: User can view contest details with class options
- CONT-03: User can view contest results with team rankings
- CONT-04: User can view individual team detail

### Plans
- [x] 03-01-PLAN.md — Contest Store: API client, Pinia store, TypeScript types
- [x] 03-02-PLAN.md — Contest List View: card layout, /contests route
- [x] 03-03-PLAN.md — Contest Detail View: header, classes list, register/results links
- [x] 03-04-PLAN.md — Contest Results & Team Detail Views: tabbed ranked table, score breakdown, markings list

### Success Criteria
1. Visible contests are listed
2. Contest details show classes
3. Results show ranked teams by class
4. Team detail shows markings (after contest close)
5. All views work without login

---

## Phase 4: Team Registration

**Goal:** Register teams, view own teams in contests

### Requirements
- TEAM-01: Authenticated user can register a team for a contest
- TEAM-02: User can view their registered teams in a contest
- TEAM-03: User can view details of their registered team

### Plans
- [ ] 04-01-PLAN.md — Foundation: types, API client, team store, Dexie schema extension
- [ ] 04-02-PLAN.md — UI: RegistrationModal, MyTeamsView, router route

### Success Criteria
1. User can register team with name, members, class
2. User sees registered team in contest
3. Active team persists across refresh
4. User can view team activation state

---

## Phase 5: Race Participation

**Goal:** QR scanning, live scoring, position tracking

### Requirements
- RACE-01: User can scan START checkpoint to begin race
- RACE-02: User can scan regular checkpoints during active event
- RACE-03: User can scan FINISH checkpoint to end race
- RACE-04: After each scan, user sees updated score
- RACE-05: After each scan, user sees position within class
- RACE-06: After FINISH, user sees final score with penalty breakdown
- RACE-07: Re-scanning same checkpoint is handled gracefully
- SCAN-01: App uses camera to detect and decode QR codes
- SCAN-02: App extracts checkpoint ID from QR payload
- SCAN-03: App handles Estonian characters in CP codes
- SCAN-04: User can manually enter CP code as fallback
- SCAN-05: App provides success/error feedback after scan

### Plans
- [ ] 05-01-PLAN.md — Foundation: types, marking API, race store, toast composable
- [ ] 05-02-PLAN.md — RaceScanner: QR camera, Estonian char decode, manual entry
- [ ] 05-03-PLAN.md — ScoreCard + TeamInfoCard: live score display, position ordinal
- [ ] 05-04-PLAN.md — RaceScorePanel + RaceView: collapsible breakdown, combined view, router

### Success Criteria
1. Camera QR scanning works on mobile
2. START scan begins race, sets startDT
3. Regular CP scan updates score
4. FINISH scan ends race, shows final score
5. Position in class updates after each scan
6. Re-scanning handled gracefully (no error)
7. Manual entry works as fallback
8. Estonian characters handled in CP codes

---

## Phase 6: Offline Support

**Goal:** Queue markings when offline, sync when back online

### Requirements
- OFFL-01: User can queue marking when device is offline
- OFFL-02: Queued markings persist if browser closes
- OFFL-03: App syncs queued markings when back online
- OFFL-04: App shows indicator when offline
- OFFL-05: App shows pending sync count

### Plans

#### Plan 6.1: Offline Queue (Dexie)
- Set up Dexie database
- Create pendingMarkings table
- Store: checkPointId, userTeamId, lat, lon, dt, synced
- Add methods: addToQueue, getPending, markSynced

#### Plan 6.2: Online Detection
- Use navigator.onLine + event listeners
- Create useOffline composable
- Provide isOnline reactive state

#### Plan 6.3: Sync Manager
- Process queue when back online
- Handle partial failures (retry)
- Show sync progress
- Remove successfully synced entries

#### Plan 6.4: Offline UI
- Show banner when offline
- Show pending marking count
- Queue markings seamlessly
- Show "Syncing..." when reconnecting

### Success Criteria
1. Marking queued in IndexedDB when offline
2. Queue persists if browser closes
3. Queue processes when back online
4. Offline indicator shown when disconnected
5. Pending count displayed to user

---

## Phase 7: Polish & Deploy

**Goal:** Final integration, GitLab CI/CD setup

### Plans

#### Plan 7.1: Performance Optimization
- Optimize bundle size
- Optimize PWA caching
- Add loading states
- Test on real devices

#### Plan 7.2: Error Handling
- Global error boundary
- API error handling
- Offline error handling
- User-friendly error messages

#### Plan 7.3: GitLab CI/CD
- Docker build pipeline
- Docker push to registry
- Deploy stage (user-configured)

---

## Success Criteria Summary

| Phase | Criteria Count |
|-------|---------------|
| Phase 1 | 5 |
| Phase 2 | 6 |
| Phase 3 | 4 |
| Phase 4 | 3 |
| Phase 5 | 12 |
| Phase 6 | 5 |
| Phase 7 | — |

**Total:** 35 requirements across 6 delivery phases

---

*Roadmap created: 2025-05-13*