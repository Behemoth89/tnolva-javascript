# Requirements: Nutikas Rogaine Mobile App

**Defined:** 2025-05-13
**Core Value:** Participants complete checkpoints and finish the race with confidence their scores are captured correctly and reflected live.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can register with email, password, first name, and last name
- [ ] **AUTH-02**: User can log in with email and password
- [ ] **AUTH-03**: User receives JWT on login/registration
- [ ] **AUTH-04**: JWT persists across browser refresh (stored in IndexedDB)
- [ ] **AUTH-05**: User can log out and tokens are cleared
- [ ] **AUTH-06**: App automatically refreshes JWT when expired (using refresh token)

### Contests

- [x] **CONT-01**: User can browse visible contests without logging in
- [x] **CONT-02**: User can view contest details with class options
- [ ] **CONT-03**: User can view contest results with team rankings
- [ ] **CONT-04**: User can view individual team detail (markings visible after contest close)

### Teams

- [ ] **TEAM-01**: Authenticated user can register a team for a contest
- [ ] **TEAM-02**: User can view their registered teams in a contest
- [ ] **TEAM-03**: User can view details of their registered team

### Race Participation

- [ ] **RACE-01**: User can scan START checkpoint to begin race
- [ ] **RACE-02**: User can scan regular checkpoints during active event
- [ ] **RACE-03**: User can scan FINISH checkpoint to end race
- [ ] **RACE-04**: After each scan, user sees updated score
- [ ] **RACE-05**: After each scan, user sees position within class
- [ ] **RACE-06**: After FINISH, user sees final score with penalty breakdown
- [ ] **RACE-07**: Re-scanning same checkpoint is handled gracefully (no error)

### QR Scanning

- [ ] **SCAN-01**: App uses camera to detect and decode QR codes
- [ ] **SCAN-02**: App extracts checkpoint ID from QR payload
- [ ] **SCAN-03**: App handles Estonian characters in CP codes (HTML entities)
- [ ] **SCAN-04**: User can manually enter CP code as fallback
- [ ] **SCAN-05**: App provides success/error feedback after scan (visual, optional haptic)

### Offline Support

- [ ] **OFFL-01**: User can queue marking when device is offline
- [ ] **OFFL-02**: Queued markings persist if browser closes
- [ ] **OFFL-03**: App syncs queued markings when back online
- [ ] **OFFL-04**: App shows indicator when offline
- [ ] **OFFL-05**: App shows pending sync count

### PWA

- [ ] **PWA-01**: App is installable on mobile home screen
- [ ] **PWA-02**: App works when device is offline (shows cached UI)
- [ ] **PWA-03**: App shows "update available" prompt when new version deployed

### Docker

- [ ] **DOCK-01**: Vue app runs in Docker container
- [ ] **DOCK-02**: Container serves app on configured port
- [ ] **DOCK-03**: CORS is configured for API communication

## v2 Requirements

### Notifications
- **NOTF-01**: User receives push notification when race starts
- **NOTF-02**: User receives push notification with final results

### Social
- **SOCL-01**: User can share team results link
- **SOCL-02**: User can view friends' team results

### Organiser
- **ORGN-01**: Organiser can create contests
- **ORGN-02**: Organiser can manage checkpoints
- **ORGN-03**: Organiser can view all markings in real-time

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth social login | Email/password sufficient for v1 |
| Multiple device sessions | Single session per account |
| Push notifications | Phase 2+ |
| Offline contest browsing | Participants already have signal or will use offline queue |
| Real-time WebSocket updates | Poll-based is acceptable for live score |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-03 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| TEAM-01 | Phase 4 | Pending |
| TEAM-02 | Phase 4 | Pending |
| TEAM-03 | Phase 4 | Pending |
| RACE-01 | Phase 5 | Pending |
| RACE-02 | Phase 5 | Pending |
| RACE-03 | Phase 5 | Pending |
| RACE-04 | Phase 5 | Pending |
| RACE-05 | Phase 5 | Pending |
| RACE-06 | Phase 5 | Pending |
| RACE-07 | Phase 5 | Pending |
| SCAN-01 | Phase 5 | Pending |
| SCAN-02 | Phase 5 | Pending |
| SCAN-03 | Phase 5 | Pending |
| SCAN-04 | Phase 5 | Pending |
| SCAN-05 | Phase 5 | Pending |
| OFFL-01 | Phase 6 | Pending |
| OFFL-02 | Phase 6 | Pending |
| OFFL-03 | Phase 6 | Pending |
| OFFL-04 | Phase 6 | Pending |
| OFFL-05 | Phase 6 | Pending |
| PWA-01 | Phase 1 | Pending |
| PWA-02 | Phase 1 | Pending |
| PWA-03 | Phase 1 | Pending |
| DOCK-01 | Phase 1 | Pending |
| DOCK-02 | Phase 1 | Pending |
| DOCK-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 ✓

---
*Requirements defined: 2025-05-13*
*Last updated: 2025-05-13 after initial definition*