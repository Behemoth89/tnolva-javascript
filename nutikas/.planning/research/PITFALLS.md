# Pitfalls Research: Vue 3 Rogaine PWA

## What This Is

Common mistakes to avoid when building a mobile-first Vue 3 rogaine PWA.

## Critical Pitfalls

### 1. PWA Not Installable
**Problem**: Missing icons, manifest misconfigured, no HTTPS in production.

**Prevention**:
- Generate 192x192 and 512x512 PNG icons
- Verify manifest has `icons` array with correct sizes
- Deploy to HTTPS (or localhost for dev)

**Phase**: PWA setup phase

### 2. JWT Token Loss on Refresh
**Problem**: User logged out when JWT expires, tokens not persisted.

**Prevention**:
- Store tokens in IndexedDB via Pinia persist plugin
- Implement token refresh interceptor
- On app load, check token validity and refresh if needed

**Phase**: Authentication phase

### 3. Offline Markings Lost
**Problem**: Markings submitted while offline are lost if browser closes.

**Prevention**:
- Store pending markings in IndexedDB (Dexie)
- Process queue when back online
- Show visual indicator of pending syncs
- Handle partial sync failures

**Phase**: Offline support phase

### 4. Camera Not Working on Mobile
**Problem**: QR scanner fails on mobile browsers.

**Prevention**:
- Always provide manual CP code entry fallback
- Request camera permission properly
- Handle HTTPS requirement for camera
- Test on actual mobile devices

**Phase**: QR scanning phase

### 5. Estonian Characters in CP Codes
**Problem**: QR codes contain Estonian characters that fail string matching.

**Prevention**:
- URL-decode QR payload before lookup
- Handle HTML entities (`&Otilde;`, `&Auml;`, etc.)
- Test with real Estonian CPs

**Phase**: QR scanning phase

### 6. Service Worker Cache Stale
**Problem**: Old app served after update, user sees broken app.

**Prevention**:
- Use `registerType: 'autoUpdate'` in vite-plugin-pwa
- Show "Update available" prompt when new SW ready
- Clear old caches on activation

**Phase**: PWA setup phase

### 7. Docker CORS Issues
**Problem**: Vue app in container can't reach backend.

**Prevention**:
- Configure CORS headers on .NET backend
- Use Docker network or nginx reverse proxy
- Set correct API base URL in environment

**Phase**: Docker deployment phase

### 8. Large IndexedDB Writes Block UI
**Problem**: Offline sync operations freeze the app.

**Prevention**:
- Use Dexie transactions properly
- Process queue in small batches
- Show progress indicators

**Phase**: Offline support phase

## Watch For

- Camera permissions on iOS Safari (more restrictive)
- IndexedDB quota limits on some devices
- Background sync limitations on mobile browsers
- Token expiry timing (refresh before expiry, not after)

## Confidence

**High** — Based on common PWA pitfalls and rogaine app domain.

---

*Last updated: 2025-05-13*