# Research Summary: Vue 3 Rogaine PWA

## What This Is

Synthesized findings from parallel research on stack, features, architecture, and pitfalls for a mobile-first Vue 3 rogaine PWA.

## Key Findings

### Stack
- **Vite 5.x + Vue 3.4+ + TypeScript**: Standard modern Vue setup
- **vite-plugin-pwa**: Generates manifest + Workbox service worker
- **vue-qrcode-reader 6.x**: Vue-native QR scanning with camera
- **Dexie.js 4.x**: IndexedDB wrapper for offline marking queue
- **Pinia 2.x**: State management with persist capability
- **Axios**: HTTP client with JWT interceptor support

### Table Stakes Features
- Email/password auth with JWT + refresh tokens
- Public contest browsing and results
- Team registration (auth required)
- QR checkpoint scanning
- Live score display after each scan

### Differentiating Features
- **Offline marking queue**: Queue scans in IndexedDB, sync when online
- **Real-time position**: Show live ranking within class
- **Mobile-first PWA**: Installable, works offline

### Watch Out For
1. **Camera on mobile**: Provide manual fallback, handle HTTPS requirement
2. **Estonian characters**: URL-decode CP codes from QR payloads
3. **Token persistence**: Store in IndexedDB to survive page refresh
4. **Service worker stale cache**: Use autoUpdate, show refresh prompt
5. **Docker CORS**: Configure backend CORS headers for containerized frontend

## Phase Implications

| Phase | Focus | Key Risk |
|-------|-------|----------|
| 1 | Scaffolding, PWA, routing | PWA installability |
| 2 | Authentication | Token persistence |
| 3 | Public views | API integration |
| 4 | Team registration | Auth guard |
| 5 | QR scanning | Camera permissions |
| 6 | Offline sync | Queue reliability |
| 7 | Docker | CORS configuration |

## Confidence

**High** — Based on web research and provided API spec.

---

*Last updated: 2025-05-13*