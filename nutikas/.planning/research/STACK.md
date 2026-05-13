# Stack Research: Vue 3 Rogaine PWA

## What This Is

Research on the frontend technology stack for a mobile-first Vue 3 PWA that connects to an existing .NET backend.

## Standard Stack

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| Build tool | Vite | 5.x | Fast HMR, optimized builds, recommended for Vue 3 |
| Framework | Vue | 3.4+ | User-specified, Composition API for offline state |
| Language | TypeScript | 5.x | Required for maintainability |
| PWA plugin | vite-plugin-pwa | 0.20+ | Generates manifest + service worker via Workbox |
| State | Pinia | 2.x | Official Vue store, works with persistence |
| Router | Vue Router | 4.x | Official routing, supports deep linking |
| HTTP client | Axios | 1.x | Mature, supports interceptors for JWT refresh |
| QR scanning | vue-qrcode-reader | 6.x | Vue-native, browser camera support |
| Offline storage | Dexie.js | 4.x | IndexedDB wrapper, Vue-friendly, offline sync support |
| Icons | @heroicons/vue | 2.x | Clean, tree-shakeable |
| CSS | Tailwind CSS | 3.x | Fast styling, mobile-first utilities |

## Key Libraries

### PWA & Offline
- **vite-plugin-pwa**: Generates service worker, manifest, handles update prompts
- **Dexie.js**: IndexedDB wrapper for offline marking queue
- **Workbox**: Underlies vite-plugin-pwa, provides caching strategies

### QR Scanning
- **vue-qrcode-reader**: Vue 3 components for camera-based QR scanning
- Requires HTTPS in production (camera access)
- Provides `QrcodeStream` component for continuous scanning

### State Management
- **Pinia**: Store for auth tokens, user state, active team
- Persist Pinia to IndexedDB for offline access to tokens/userInfo

## NOT Recommended

| Library | Reason |
|---------|--------|
| Vue CLI | Deprecated, Vite is the standard |
| Vuex | Deprecated, Pinia is the official recommendation |
| LocalStorage | Too limited for marking queue |
| ServiceWorker from scratch | Use vite-plugin-pwa + Workbox |
| QuaggaJS | More complex, vue-qrcode-reader is simpler for Vue |

## Version Notes

Verify current versions at time of implementation:
- Run `npm show vite-plugin-pwa version`
- Run `npm show vue-qrcode-reader version`
- Run `npm show dexie version`

## Confidence

**High** — These are established choices for Vue 3 PWAs in 2025/2026.

---

*Last updated: 2025-05-13*