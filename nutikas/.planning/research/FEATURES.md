# Features Research: Vue 3 Rogaine PWA

## What This Is

Analysis of expected features for a mobile-first rogaine event app.

## Feature Categories

### Authentication (Table Stakes)
- Email/password registration
- Email/password login
- JWT token management (refresh on expiry)
- Session persistence across browser refresh
- Logout

### Contest Discovery (Table Stakes)
- Browse visible contests (public endpoint)
- View contest details with classes
- View contest results and rankings
- View team detail with marking history

### Team Registration (Table Stakes)
- Register team for a contest (auth required)
- View own teams in a contest
- View team details

### Race Participation (Core Value)
- Scan START checkpoint to begin
- Scan regular checkpoints during event
- View live score after each scan
- View position within class (live ranking)
- Scan FINISH checkpoint to end
- View final score with penalty breakdown

### Offline Support (Critical)
- Queue markings when offline
- Sync queue when back online
- Persist active team info offline
- Show offline indicator

### QR Scanning (Table Stakes)
- Camera-based QR scanning
- Manual CP code entry as fallback
- Success/error feedback (vibrate, sound)
- Handle Estonian special characters in CP codes

## Out of Scope (Anti-features)

| Feature | Reason |
|---------|--------|
| Push notifications | Phase 2+ |
| OAuth social login | Email/password sufficient |
| Multiple device sessions | Single session per account |
| Offline contest browsing | Not critical for event use |
| Real-time WebSocket updates | Poll-based is acceptable |

## Feature Dependencies

1. **Authentication** must work before team registration
2. **Team registration** must exist before race participation
3. **Offline queue** must work before race participation
4. **QR scanning** is the primary input for race participation

## Confidence

**High** — Based on provided user-flow.md and API spec.

---

*Last updated: 2025-05-13*