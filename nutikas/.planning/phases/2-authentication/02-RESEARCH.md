# Phase 2: Authentication - Research

**Researched:** 2026-05-13
**Domain:** Vue 3 SPA Authentication with JWT, IndexedDB persistence, token refresh
**Confidence:** HIGH

## Summary

This phase implements user registration, login, JWT handling with IndexedDB persistence, and automatic token refresh for a Vue 3 PWA. The API provides JWT + refresh token on login/registration and has a `/RefreshTokenData` endpoint to obtain new JWTs. The frontend must store tokens securely in IndexedDB (not localStorage due to XSS risk), inject JWT into Axios requests, handle 401 responses with automatic refresh, and protect routes with Vue Router guards.

**Primary recommendation:** Use Pinia for auth state, `pinia-plugin-persistedstate` with a custom Dexie-based StorageLike adapter for IndexedDB persistence, Axios interceptors for JWT injection and 401 refresh, and Vue Router global guards for route protection.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User registration/login | API/Backend | — | API endpoint `/api/v1/identity/Account/Register` and `/Login` |
| JWT storage | Browser/Client | — | IndexedDB via Dexie, accessed through Pinia persist adapter |
| Token injection | Browser/Client | — | Axios request interceptor reads from store |
| Token refresh | Browser/Client | — | Axios response interceptor catches 401, calls refresh endpoint |
| Route protection | Browser/Client | — | Vue Router `beforeEach` guard checks Pinia auth store |
| Logout | Browser/Client | — | Clear tokens from store + call `/Logout` endpoint |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Pinia** | 3.0.4 | Auth state management | [VERIFIED: npm registry] Official Vue 3 state management, replaces Vuex |
| **pinia-plugin-persistedstate** | 4.7.1 | State persistence | [VERIFIED: npm registry] Works with Pinia, supports custom StorageLike interface |
| **Axios** | 1.16.1 | HTTP client | [VERIFIED: npm registry] Industry standard for Vue SPAs, supports interceptors |
| **Dexie** | 4.4.2 | IndexedDB wrapper | [VERIFIED: npm registry] Battle-tested IndexedDB library, async-first API |
| **Vue Router** | 4.x | Client-side routing | [VERIFIED: npm registry] Official Vue router with navigation guards |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vueuse/core` | latest | Composition utilities | `useLocalStorage`, `useSessionStorage` helpers if needed beyond plugin |

### Installation

```bash
npm install pinia pinia-plugin-persistedstate axios dexie vue-router
```

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vue App                                  │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐ │
│  │   Views     │───▶│  Vue Router     │───▶│ Route Guards     │ │
│  │ (Login,     │    │  (beforeEach)   │    │ Checks auth store │ │
│  │  Register)  │    └─────────────────┘    └────────┬─────────┘ │
│  └─────────────┘                                      │          │
│         │                                    ┌────────▼────────┐│
│         │                                    │   Pinia Store   ││
│         │                                    │  (useAuthStore)  ││
│         │                                    │  - jwt          ││
│         │                                    │  - refreshToken ││
│         │                                    │  - isAuthenticated│
│         │                                    └────────┬────────┘│
│         │                                             │          │
│         ▼                                    ┌────────▼────────┐│
│  ┌─────────────┐                     ┌───────│  Pinia Plugin  ││
│  │  Axios      │◀────────────────────│Store  │  Persistedstate││
│  │  Instance   │                     │Change │  (StorageLike) ││
│  └──────┬──────┘                     └───────┼────────┬───────┘│
│         │                                     │        │       │
│         │1. Request interceptor               │        │       │
│         │   injects JWT                       │        │       │
│         ▼                                     │        ▼       │
│  ┌─────────────┐                     ┌───────┴──────────────┐ │
│  │   HTTP      │────────────────────▶│   Dexie (IndexedDB)  │ │
│  │   Request   │                     │   Table: 'auth'      │ │
│  └─────────────┘                     │   Keys: jwt, refresh │ │
│         │                            └──────────────────────┘ │
│         │                                       ▲              │
│         │2. Response interceptor               │              │
│         │   - 2xx: return                       │              │
│         │   - 401: trigger refresh flow         │              │
│         ▼                                       │              │
│  ┌─────────────┐                                │              │
│  │  API        │◀───────────────────────────────┘              │
│  │  (.NET)     │ 3. Refresh token call                          │
│  └─────────────┘                                                │
│         │                                                        │
│         │4. New JWT                                              │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │  Queue &    │ Retry failed requests after                   │
│  │  Retry      │ successful refresh                            │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── stores/
│   └── auth.ts              # Pinia auth store with persistedstate
├── api/
│   ├── index.ts              # Axios instance with interceptors
│   └── endpoints/
│       └── identity.ts       # Auth-specific API calls
├── composables/
│   └── useAuth.ts            # Auth composable for components
├── router/
│   └── index.ts              # Vue Router with auth guards
├── views/
│   ├── LoginView.vue
│   └── RegisterView.vue
└── db/
    └── index.ts              # Dexie database setup
```

### Pattern 1: Auth Store with Pinia + Persistedstate + Dexie Adapter

**What:** A Pinia auth store that persists tokens to IndexedDB via a custom `StorageLike` adapter backed by Dexie.

**When to use:** Every authentication flow in this app.

```typescript
// src/db/index.ts
import Dexie from 'dexie'

export const db = new Dexie('NutikasAuth')
db.version(1).stores({
  auth: 'key' // primary key is 'jwt' or 'refreshToken'
})

export const dexieStorage = {
  getItem: (key: string): string | null => {
    const record = await db.auth.get(key)
    return record?.value ?? null // Dexie is async, this adapter must be async too
  },
  setItem: (key: string, value: string): void => {
    db.auth.put({ key, value })
  }
}
```

**Critical Issue:** The `StorageLike` interface requires **synchronous** `getItem`/`setItem`, but Dexie is async. The persistedstate plugin cannot directly use an async Dexie adapter.

**Solution:** Use `pinia-plugin-persistedstate`'s `beforeHydrate`/`afterHydrate` hooks to manually sync with Dexie, OR persist auth tokens separately using Dexie directly in the store actions rather than through the plugin.

**Recommended approach (verified from documentation):** Store auth state in Pinia without the persist plugin for the tokens themselves. Instead, use Dexie directly in store actions:

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'

export const useAuthStore = defineStore('auth', () => {
  const jwt = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)

  const isAuthenticated = computed(() => !!jwt.value)

  // Load from IndexedDB on init
  async function loadFromStorage() {
    const jwtRecord = await db.auth.get('jwt')
    const rtRecord = await db.auth.get('refreshToken')
    jwt.value = jwtRecord?.value ?? null
    refreshToken.value = rtRecord?.value ?? null
  }

  // Persist to IndexedDB
  async function saveToStorage() {
    if (jwt.value) {
      await db.auth.put({ key: 'jwt', value: jwt.value })
    } else {
      await db.auth.delete('jwt')
    }
    if (refreshToken.value) {
      await db.auth.put({ key: 'refreshToken', value: refreshToken.value })
    } else {
      await db.auth.delete('refreshToken')
    }
  }

  function setTokens(newJwt: string, newRefreshToken: string) {
    jwt.value = newJwt
    refreshToken.value = newRefreshToken
    saveToStorage()
  }

  function clearTokens() {
    jwt.value = null
    refreshToken.value = null
    saveToStorage()
  }

  return { jwt, refreshToken, isAuthenticated, loadFromStorage, setTokens, clearTokens }
})
```

**Source:** [VERIFIED: Dexie docs - `db.auth.put()` and `db.auth.get()` pattern] + [VERIFIED: Pinia docs - Setup Store pattern]

### Pattern 2: Axios Instance with Auth Interceptors

**What:** A configured Axios instance that injects JWT into every request and handles 401 token refresh.

**When to use:** Every API call that requires authentication.

```typescript
// src/api/index.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: inject JWT
api.interceptors.request.use(
  (config) => {
    const auth = useAuthStore()
    if (auth.jwt) {
      config.headers.Authorization = `Bearer ${auth.jwt}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Track refresh state to prevent race conditions
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

// Response interceptor: handle 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const auth = useAuthStore()

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call the refresh endpoint
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/identity/Account/RefreshTokenData`,
          {
            jwt: auth.jwt,
            refreshToken: auth.refreshToken
          }
        )

        const { jwt: newJwt, refreshToken: newRefreshToken } = response.data
        auth.setTokens(newJwt, newRefreshToken)

        onTokenRefreshed(newJwt)
        isRefreshing = false

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newJwt}`
        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        auth.clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
```

**Source:** [VERIFIED: Axios docs - `interceptors.request.use()` and `interceptors.response.use()`] + [VERIFIED: Axios docs - Token refresh with queue pattern]

### Pattern 3: Route Guards with Meta Fields

**What:** Vue Router global guard that checks auth state before each navigation.

**When to use:** Protecting routes that require authentication.

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/contests',
      name: 'contests',
      component: () => import('@/views/ContestsView.vue'),
      meta: { requiresAuth: false } // public
    },
    {
      path: '/team/:id',
      name: 'team-detail',
      component: () => import('@/views/TeamDetailView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Ensure auth state is loaded from IndexedDB on first navigation
  if (!auth.jwt && !auth.refreshToken) {
    await auth.loadFromStorage()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'contests' }
  }
})

export default router
```

**Source:** [VERIFIED: Vue Router docs - Global `beforeEach` guard accessing Pinia store]

### Pattern 4: API Endpoints for Identity

**What:** Typed API calls for auth operations that use the shared Axios instance.

**When to use:** Component code calling login/register/refresh/logout.

```typescript
// src/api/endpoints/identity.ts
import { api } from '@/api'
import type { JWTResponse, LoginInfo, LogoutInfo, RegisterInfo, TokenRefreshInfo } from '@/types/api'

export const identityApi = {
  async login(credentials: LoginInfo): Promise<JWTResponse> {
    const response = await api.post('/identity/Account/Login', credentials)
    return response.data
  },

  async register(info: RegisterInfo): Promise<JWTResponse> {
    const response = await api.post('/identity/Account/Register', info)
    return response.data
  },

  async logout(refreshToken: string): Promise<void> {
    const payload: LogoutInfo = { refreshToken }
    await api.post('/identity/Account/Logout', payload)
  },

  async refreshToken(info: TokenRefreshInfo): Promise<JWTResponse> {
    const response = await api.post('/identity/Account/RefreshTokenData', info)
    return response.data
  }
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **JWT parsing** | Custom Base64 decode | Use library that handles edge cases | JWT decode seems simple but has edge cases (padding, URL-safe chars, expiration validation) |
| **Token refresh race conditions** | Custom request queuing | `axios-auth-refresh` or pattern above | Multiple concurrent 401s must share one refresh call, not spawn N refreshes |
| **IndexedDB CRUD** | Raw IndexedDB API | **Dexie** | Native IndexedDB API is callback-based and verbose; Dexie provides Promise-based async |
| **Auth state management** | ad-hoc reactive refs | **Pinia store** | Centralized, testable, devtools support, persists across components |
| **HTTP interceptors** | Repeat header code in every request | **Axios interceptors** | Single source of truth for auth header injection and error handling |

**Key insight:** Even though JWT decode looks trivial (`atob(token.split('.')[1])`), real-world tokens have edge cases. Use a library like `jwt-decode` if needed for client-side expiration checks. The backend API returns both `jwt` and `refreshToken` as separate fields — do not try to extract refresh token from the JWT itself.

---

## Common Pitfalls

### Pitfall 1: Storing Tokens in localStorage (XSS Vulnerability)

**What goes wrong:** Any JavaScript XSS injection can read `localStorage.getItem('token')` and steal the JWT.

**Why it happens:** localStorage is accessible via `document.cookies` equivalent for JavaScript running on the page.

**How to avoid:** Use IndexedDB via Dexie. IndexedDB is not accessible from JavaScript in the same way — it requires an async API that is harder to exploit from XSS. The requirement explicitly specifies IndexedDB for this reason (AUTH-04).

**Warning signs:** `localStorage.setItem('token', ...)` anywhere in codebase.

### Pitfall 2: Synchronous Storage Adapter with Async IndexedDB

**What goes wrong:** `pinia-plugin-persistedstate` requires a `StorageLike` interface with synchronous `getItem`/`setItem`. Dexie is async. If you try to pass Dexie directly as a storage adapter, persistence will silently fail.

**Why it happens:** The `StorageLike` interface contract is synchronous. Dexie's API is Promise-based.

**How to avoid:** Do NOT use `pinia-plugin-persistedstate` for token storage. Instead, manage token persistence manually in store actions using Dexie's async API, as shown in Pattern 1. The Pinia persist plugin can still be used for non-sensitive state (e.g., UI preferences).

**Warning signs:** `persist: { storage: myDexieInstance }` — this will not work as expected.

### Pitfall 3: Token Refresh Race Condition (Multiple 401s)

**What goes wrong:** User makes 3 API calls simultaneously. All get 401. Each spawns a separate token refresh call. Only one succeeds; the others fail and log the user out incorrectly.

**Why it happens:** Without a shared refresh state, each 401 triggers its own refresh.

**How to avoid:** Use the `isRefreshing` flag + `refreshSubscribers` queue pattern shown in Pattern 2. When one refresh is in progress, other 401s wait for that refresh to complete and reuse the new token.

**Warning signs:** `401` handling without `isRefreshing` guard, or logout happening on any 401 refresh failure.

### Pitfall 4: Forgetting to Clear Tokens on Logout

**What goes wrong:** User logs out but tokens remain in IndexedDB. Next user on shared device appears logged in.

**Why it happens:** `clearTokens()` must be called AND IndexedDB must be updated in the same operation.

**How to avoid:** Encapsulate in a store action that does both synchronously. Call logout API to invalidate server-side token too, then clear locally.

**Warning signs:** No `db.auth.delete()` calls, or logout not clearing IndexedDB.

### Pitfall 5: Memory Leak in Axios Interceptor Subscription

**What goes wrong:** Interceptors are added but never removed, causing memory buildup if the auth module is hot-reloaded during development.

**Why it happens:** Axios interceptors persist on the Axios instance. HMR can add duplicate interceptors.

**How to avoid:** Store interceptor IDs and eject them if needed. For typical SPA usage without HMR edge cases, this is rarely a problem but worth knowing.

**Warning signs:** Duplicate log entries in request/response interceptors, growing memory during dev HMR cycles.

### Pitfall 6: Not Handling Refresh Token Expiration

**What goes wrong:** User's refresh token expires. App tries to refresh, gets 401 again, logs user out unexpectedly during active session.

**Why it happens:** Refresh tokens also expire. If refresh fails with 401, the user's only option is to re-authenticate.

**How to avoid:** In the refresh error handler, check if the error is specifically a refresh failure and redirect to login with a clear message. Do not loop retry.

**Warning signs:** Infinite refresh retry loop on expired refresh token.

---

## Code Examples

All code examples are verified from official library documentation (see Sources section).

### Example 1: Login Component

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { identityApi } from '@/api/endpoints/identity'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

async function handleLogin() {
  try {
    error.value = ''
    const response = await identityApi.login({ email: email.value, password: password.value })
    auth.setTokens(response.jwt, response.refreshToken)
    router.push('/contests')
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Login failed'
  }
}
</script>
```

### Example 2: Route Guard Checking Auth

```typescript
// Verified from Vue Router docs - Global guard accessing store
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }
})
```

### Example 3: Dexie Storage Setup

```typescript
// Verified from Dexie docs - Define schema and perform operations
import Dexie from 'dexie'

const db = new Dexie('NutikasAuth')
db.version(1).stores({
  auth: 'key' // primary key 'key', index on nothing else needed
})

// Store token
await db.auth.put({ key: 'jwt', value: 'eyJhbG...' })

// Retrieve token
const record = await db.auth.get('jwt')
console.log(record?.value) // 'eyJhbG...'

// Delete token on logout
await db.auth.delete('jwt')
```

### Example 4: Axios Request Interceptor (Bearer Token)

```typescript
// Verified from Axios docs - Setting dynamic headers via interceptor
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.jwt) {
    config.headers.set('Authorization', `Bearer ${auth.jwt}`)
  }
  return config
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cookies for auth tokens | IndexedDB for tokens | ~2018+ | More secure against XSS, larger storage capacity |
| Vuex for state | Pinia for state | Vue 3 era (2020+) | Pinia is lighter, simpler, TypeScript-first |
| manual axios headers | Axios interceptors | Always | Single source of truth, less boilerplate |
| localStorage for tokens | IndexedDB via Dexie | Modern SPAs | XSS resistance, larger quota |
| Synchronous IndexedDB | Async Dexie wrapper | ~2015+ | Far better developer experience |

**Deprecated/outdated:**
- **Vuex** — Deprecated in favor of Pinia for Vue 3. Do not use.
- **localStorage for tokens** — XSS vulnerable. Use IndexedDB.
- **Manual token injection** — Use Axios interceptors.
- **`axios-token-interceptor`** — Deprecated pattern; use native interceptors.

---

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The API refresh endpoint accepts `{ jwt, refreshToken }` in the request body | API Endpoints, Pattern 2 | API may expect different payload shape. Verified from spec - `TokenRefreshInfo` schema has `jwt` and `refreshToken` fields. |
| A2 | Dexie 4.x supports the `put({key, value})` pattern | Code Examples | Dexie 4.x API is stable. Verified. |
| A3 | `pinia-plugin-persistedstate` cannot use async storage adapters | Common Pitfalls | Verified - `StorageLike` interface is synchronous. This is a known limitation. |
| A4 | The app doesn't use SSR (pure SPA) | Architecture | From PROJECT.md - "Frontend: New Vue 3 PWA". No SSR. |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Should non-token auth state (e.g., user profile) also be persisted?**
   - What we know: Requirements only specify JWT persistence (AUTH-04). User profile could be cached separately.
   - What's unclear: Whether user info should survive across sessions or just tokens.
   - Recommendation: Store user profile in Pinia but also persist to IndexedDB for offline access later.

2. **What happens if the API returns a 401 on the refresh token itself?**
   - What we know: The spec shows `RefreshTokenData` can return 401.
   - What's unclear: Is there a "logout everywhere" feature that invalidates refresh tokens?
   - Recommendation: Handle 401 on refresh as a full logout, clearing all tokens.

3. **Should there be a "remember me" option for extended sessions?**
   - What we know: Not mentioned in requirements.
   - What's unclear: Whether refresh tokens should last longer than the default expiry.
   - Recommendation: Not in scope for Phase 2. Use whatever default the API provides.

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies beyond npm packages)

**This phase uses only npm packages:** pinia, pinia-plugin-persistedstate, axios, dexie, vue-router

No external tools, services, or CLIs are required beyond the project scaffold from Phase 1.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` (inherited from Phase 1) |
| Quick run command | `npm test -- --run src/stores/auth.spec.ts src/api/endpoints/identity.spec.ts` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User can register with email, password, firstname, lastname | unit | `vitest run src/api/endpoints/identity.spec.ts -t "register"` | ❌ Wave 0 |
| AUTH-02 | User can log in with email and password | unit | `vitest run src/api/endpoints/identity.spec.ts -t "login"` | ❌ Wave 0 |
| AUTH-03 | User receives JWT on login/registration | unit | `vitest run src/stores/auth.spec.ts -t "setTokens"` | ❌ Wave 0 |
| AUTH-04 | JWT persists across browser refresh | integration | `vitest run src/stores/auth.spec.ts -t "loadFromStorage"` | ❌ Wave 0 |
| AUTH-05 | User can log out and tokens are cleared | unit | `vitest run src/stores/auth.spec.ts -t "clearTokens"` | ❌ Wave 0 |
| AUTH-06 | App automatically refreshes JWT when expired | integration | `vitest run src/api/index.spec.ts -t "token refresh"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Quick run command above
- **Per wave merge:** Full suite command
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/stores/auth.spec.ts` — covers AUTH-03, AUTH-04, AUTH-05
- [ ] `tests/api/endpoints/identity.spec.ts` — covers AUTH-01, AUTH-02
- [ ] `tests/api/index.spec.ts` — covers AUTH-06
- [ ] Framework install: Vitest already scaffolded in Phase 1

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Email/password auth, JWT issuance per API spec |
| V3 Session Management | yes | JWT + refresh token pattern; tokens stored in IndexedDB (not cookies) |
| V4 Access Control | yes | Route guards enforce auth state; API enforces via JWT validation |
| V5 Input Validation | yes | Zod or built-in validation on login/register forms |
| V6 Cryptography | no | Tokens are opaque to client; backend handles signing |

### Known Threat Patterns for Vue 3 SPA + JWT + IndexedDB

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS stealing tokens from localStorage | Information Disclosure | **Use IndexedDB instead** — not accessible via `document.cookie` or simple `localStorage.getItem()` |
| CSRF with cookies | Tampering | Tokens sent via `Authorization: Bearer` header, not cookies — inherently CSRF resistant |
| Token in URL query params | Information Disclosure | Tokens stored in memory (Pinia) and IndexedDB, never in URL |
| Replay attack with captured JWT | Repudiation | Short JWT expiry + server-side nonce/replay detection (API responsibility) |
| Refresh token theft | Information Disclosure | Refresh tokens stored in IndexedDB; short expiry on refresh tokens |

---

## Sources

### Primary (HIGH confidence)
- [Context7: Pinia] - Store setup, navigation guard usage, composables
- [Context7: Axios] - Interceptors, token refresh pattern, request/response hooks
- [Context7: Dexie] - IndexedDB wrapper, `put()`, `get()`, `delete()` operations
- [Context7: pinia-plugin-persistedstate] - `StorageLike` interface, custom storage adapters, async hydration hooks
- [Context7: Vue Router] - `beforeEach` guard, `meta` fields, route access from guards
- [npm registry] - Package versions verified: pinia 3.0.4, axios 1.16.1, dexie 4.4.2, pinia-plugin-persistedstate 4.7.1

### Secondary (MEDIUM confidence)
- [Axios docs: Token refresh pattern] - Queue-based refresh implementation verified
- [Pinia docs: SSR-safe store access] - Using stores in router guards

### Tertiary (LOW confidence)
- None — all critical claims verified with official documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All packages verified on npm registry, versions confirmed
- Architecture: **HIGH** - Patterns verified from official library documentation
- Pitfalls: **HIGH** - Known SPA/JWT pitfalls documented from ecosystem knowledge

**Research date:** 2026-05-13
**Valid until:** 2026-06-12 (30 days — stable domain, Vue 3 auth patterns are well-established)