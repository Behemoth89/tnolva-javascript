# Architecture Research: Vue 3 Rogaine PWA

## What This Is

Analysis of the component architecture and data flow for a mobile-first rogaine PWA.

## Frontend Architecture

```
nutikas-app/
├── public/              # Static assets, PWA icons
├── src/
│   ├── assets/          # Styles, images
│   ├── components/      # Reusable Vue components
│   │   ├── auth/        # Login, register forms
│   │   ├── contest/     # Contest cards, results
│   │   ├── scanner/      # QR scanner components
│   │   └── ui/          # Buttons, inputs, etc.
│   ├── composables/     # Vue composables (useAuth, useOffline, etc.)
│   ├── router/          # Vue Router config
│   ├── services/        # API client, offline queue
│   ├── stores/          # Pinia stores
│   ├── types/           # TypeScript types
│   ├── views/           # Page components
│   ├── App.vue
│   └── main.ts
├── .planning/           # Planning docs
├── devhelp/            # API spec docs
└── Dockerfile          # Containerization
```

## Data Flow

### Online Mode
```
User Action → Vue Component → Pinia Store → API Service → .NET Backend
                ↑                                              ↓
                └──────────────── Response ←──────────────────┘
```

### Offline Mode
```
User Action → Vue Component → Pinia Store → Offline Queue (Dexie)
                                              ↓
                                    Sync when online
                                              ↓
                                    API Service → .NET Backend
```

## Key Components

### API Layer
- Axios instance with JWT interceptor
- Automatic token refresh on 401
- Base URL from environment config

### Offline Queue (Dexie)
```
Table: pendingMarkings
- id (auto)
- checkPointId (CPID from QR)
- userTeamId
- lat/lon (optional)
- dt (client timestamp)
- synced (boolean)

Table: cachedData
- type (contest, team, user)
- id
- data (JSON)
- cachedAt (timestamp)
```

### State Management (Pinia)
- `authStore`: JWT, refreshToken, user info
- `teamStore`: Active team, registration state
- `contestStore`: Current contest, results
- `markingStore`: Pending markings, sync status

## Suggested Build Order

1. **Phase 1**: Project scaffold, PWA config, basic routing
2. **Phase 2**: Authentication flow with JWT
3. **Phase 3**: Public contest views (browse, details, results)
4. **Phase 4**: Team registration
5. **Phase 5**: QR scanning + live scoreboard
6. **Phase 6**: Offline marking queue
7. **Phase 7**: Docker deployment

## Backend Integration

The .NET backend exposes `/api/v1/` endpoints:
- Public: `/contests`, `/contests/{id}`, `/contests/{id}/results`
- Auth: `/identity/account/register`, `/identity/account/login`
- Protected: `/contests/{id}/teams`, `/markings`, `/userteams/{id}`

Frontend connects via Axios to configured base URL.

## Confidence

**High** — Standard Vue 3 + PWA + offline architecture.

---

*Last updated: 2025-05-13*