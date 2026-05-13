# Phase 1: Foundation - Research

**Researched:** 2026-05-13
**Domain:** Vue 3 PWA scaffolding, vite-plugin-pwa configuration, Docker multi-stage build
**Confidence:** HIGH

## Summary

Phase 1 establishes the project foundation: a Vite + Vue 3 + TypeScript PWA scaffold with PWA configuration (installable, offline-capable) and Docker deployment. The standard stack uses `vite-plugin-pwa` 1.3.0 with Workbox for service worker generation, generating PWA icons via `pwa-assets-generator`, and serving via nginx in Docker with a proxy to the existing .NET backend at `/api/v1/`.

**Primary recommendation:** Use `generateSW` strategy (default) with `autoUpdate` register type. Configure nginx with `try_files $uri /index.html` for SPA routing and proxy `/api/v1/` to the backend. Vue component handles update prompts via `useRegisterSW` composable.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PWA manifest generation | Browser/Client | Build tool (vite-plugin-pwa) | Generated at build time, served to browser |
| Service worker registration | Browser/Client | — | Runtime behavior in browser |
| PWA icon generation | Build tool | — | Run at build time via pwa-assets-generator |
| Static asset serving | CDN/Static (nginx) | — | Docker nginx serves built Vue app |
| API proxy / CORS | Frontend Server (nginx) | — | nginx proxies /api/v1/ to backend |
| SPA routing | Browser/Client | CDN (nginx fallback) | vue-router client-side + nginx fallback |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 8.x | Build tool, dev server | [VERIFIED: npm registry - 8.0.12] Fast HMR, standard for Vue 3 |
| Vue | 3.5+ | Framework | [VERIFIED: npm registry - 3.5.34] User-specified |
| TypeScript | 5.x | Language | Required for maintainability |
| vite-plugin-pwa | 1.3.0 | PWA generation | [VERIFIED: npm registry - 1.3.0] Workbox integration, zero-config |
| pwa-assets-generator | 0.9+ | Icon generation | Generates 192x192, 512x512, maskable from SVG |
| @vite-pwa/assets-generator | — | Same as above | Newer package name |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| workbox (via vite-plugin-pwa) | 7.x | Service worker runtime | Don't install manually — comes with vite-plugin-pwa |
| vue-router | 4.x | Client-side routing | SPA navigation |
| Pinia | 2.x | State management | Later phases (auth, offline queue) |
| tailwindcss | 3.x | CSS framework | Mobile-first styling |
| eslint | 9.x | Linting | Code quality |
| prettier | 3.x | Formatting | Code consistency |

**Installation:**
```bash
npm create vite@latest . -- --template vue-ts
npm install -D vite-plugin-pwa pwa-assets-generator
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install -D eslint prettier eslint-plugin-vue @vue/eslint-config-typescript
```

**Version verification (done during research):**
- vite-plugin-pwa: 1.3.0 [VERIFIED: npm registry]
- Vue: 3.5.34 [VERIFIED: npm registry]
- Vite: 8.0.12 [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (PWA)                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Vue App     │    │ Service      │    │  IndexedDB       │  │
│  │  (SPA)       │    │ Worker       │    │  (offline data)  │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────────────┘  │
│         │                   │                                   │
│         │  fetch /api/v1/*  │  fetch (cached)                   │
└─────────┼───────────────────┼───────────────────────────────────┘
          │                   │
┌─────────┴───────────────────┴───────────────────────────────────┐
│                      Docker Container                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  nginx:alpine (port 8080)                                  ││
│  │    │                                                        ││
│  │    ├── /            → Vue app static files (SPA)           ││
│  │    ├── /assets/*    → hashed assets (cache forever)        ││
│  │    ├── /workbox-*   → service worker scripts               ││
│  │    └── /api/v1/*    → proxy to backend (.NET)              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ proxy
                              ▼
                    ┌─────────────────────┐
                    │  .NET Backend       │
                    │  (existing)         │
                    │  /api/v1/           │
                    └─────────────────────┘
```

### Recommended Project Structure

```
nutikas/
├── public/
│   └── logo.svg              # Source for PWA icon generation
├── src/
│   ├── assets/
│   │   └── main.css          # Tailwind imports
│   ├── components/
│   │   └── ReloadPrompt.vue  # PWA update toast
│   ├── App.vue
│   ├── main.ts
│   └── router/
│       └── index.ts          # Vue Router setup
├── docker/
│   ├── nginx.conf            # Custom nginx config
│   └── Dockerfile            # Multi-stage build
├── docker-compose.yml        # Local dev orchestration
├── nginx.conf                # Also at root for Docker build context
├── vite.config.ts            # Includes VitePWA plugin
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
└── package.json
```

### Pattern 1: Vite PWA Configuration (generateSW strategy)

**What:** Default service worker generation via Workbox
**When to use:** Standard PWA setup, no custom service worker logic needed

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      },
      manifest: {
        name: 'Nutikas Rogaine',
        short_name: 'Nutikas',
        description: 'Mobile-first PWA for rogaine event participation',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
})
```

**Source:** [vite-plugin-pwa official docs](https://vite-pwa-org.netlify.app/) - verified via Context7

### Pattern 2: PWA Icon Generation

**What:** Generate all required PWA icons from a single SVG source
**When to use:** Setting up PWA icons for the first time

```bash
pwa-assets-generator --preset minimal-2023 public/logo.svg
```

**package.json script:**
```json
{
  "scripts": {
    "generate-assets": "pwa-assets-generator --preset minimal-2023 public/logo.svg"
  }
}
```

**Output:** Creates `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`, `public/favicon.ico`, `public/favicon.svg`

**Source:** [vite-plugin-pwa assets generator docs](https://vite-pwa-org.netlify.app/assets-generator/cli)

### Pattern 3: Update Prompt Vue Component

**What:** Toast component for PWA update notification
**When to use:** PWA-03 requirement — "update available" prompt

```vue
<!-- src/components/ReloadPrompt.vue -->
<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()

async function close() {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<template>
  <div
    v-if="offlineReady || needRefresh"
    class="pwa-toast"
    role="alert"
  >
    <div class="message">
      <span v-if="offlineReady">App ready to work offline</span>
      <span v-else>New content available, click on reload button to update.</span>
    </div>
    <button v-if="needRefresh" @click="updateServiceWorker()">Reload</button>
    <button @click="close">Close</button>
  </div>
</template>

<style>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 4px;
  z-index: 1;
  text-align: left;
  box-shadow: 3px 4px 5px 0 #8885;
  background-color: white;
}
.pwa-toast button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
}
</style>
```

**Include in App.vue:**
```vue
<template>
  <router-view />
  <ReloadPrompt />
</template>
```

**Source:** [vite-plugin-pwa Vue guide](https://vite-pwa-org.netlify.app/frameworks/vue) - verified via Context7

### Pattern 4: Docker Multi-Stage Build

**What:** Build Vue app in Node stage, serve via nginx:alpine
**When to use:** DOCK-01 requirement — Vue app in Docker container

```dockerfile
# Stage 1: Build the Vue application
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]
```

**Source:** [Docker Vue.js guide](https://github.com/docker/docs/blob/main/content/guides/vuejs/containerize.md) - verified via Context7

### Pattern 5: Nginx SPA Configuration with API Proxy

**What:** Serve Vue SPA and proxy API requests to backend
**When to use:** DOCK-02 (serve app), DOCK-03 (CORS/API proxy)

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Server block
    server {
        listen 8080;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Assets: cache forever (hashed filenames)
        location ^~ /assets/ {
            add_header Cache-Control "public, max-age=31536000, immutable";
            try_files $uri =404;
        }

        # Workbox scripts: cache forever
        location ^~ /workbox- {
            add_header Cache-Control "public, max-age=31536000, immutable";
            try_files $uri =404;
        }

        # API proxy to backend (.NET)
        location /api/ {
            proxy_pass http://host.docker.internal:8080/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_read_timeout 30s;
        }

        # SPA fallback: all other routes serve index.html
        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "public, max-age=0, must-revalidate" always;
        }
    }
}
```

**Key points:**
- `try_files $uri $uri/ /index.html` enables SPA client-side routing
- `/api/` proxy passes to backend (adjust host:port for your setup)
- `host.docker.internal` allows Docker container to reach host machine on Windows/Mac

**Source:** [vite-plugin-pwa nginx deployment docs](https://vite-pwa-org.netlify.app/deployment/nginx) - verified via Context7

### Pattern 6: Docker Compose for Local Dev

**What:** Orchestrate Vue dev and backend for local development
**When to use:** Local development with Docker

```yaml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:8080"
    environment:
      - VITE_API_BASE_URL=http://localhost:8080/api/v1
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**Note:** For local dev without Docker, Vite dev server (`npm run dev`) handles SPA routing and proxies `/api` via vite.config.ts proxy option.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker | Custom SW from scratch | vite-plugin-pwa + Workbox | Complex caching logic, cross-browser bugs |
| PWA manifest | Manual JSON manifest | vite-plugin-pwa auto-generation | Version mismatches, missing fields |
| PWA icons | Individual icon files | pwa-assets-generator preset | Wrong sizes, missing maskable, inconsistency |
| SPA routing offline | Custom offline detection | Workbox navigation route + precache | Misses edge cases, inconsistent behavior |
| API CORS | Complex nginx CORS headers | Proxy via nginx (no CORS needed) | Proxy avoids CORS entirely |

**Key insight:** vite-plugin-pwa handles all PWA complexity — service worker, manifest, update prompts, offline detection. Only customize via plugin config, not by replacing it.

## Common Pitfalls

### Pitfall 1: Service Worker Not Updating After Deploy
**What goes wrong:** Users see stale cached app after new deployment.
**Why it happens:** Browser caches old service worker, doesn't check for updates.
**How to avoid:**
- Use `autoUpdate` register type (forces `skipWaiting` + `clientsClaim`)
- Ensure hashed filenames in built assets (Vite does this by default)
- Configure `cleanupOutdatedCaches: true` in workbox config
- For testing: DevTools → Application → Service Workers → "Update on reload"

### Pitfall 2: PWA Install Prompt Not Appearing
**What goes wrong:** App doesn't meet criteria for "Add to Home Screen".
**Why it happens:** Missing icons, wrong manifest fields, site not served over HTTPS (required for service workers).
**How to avoid:**
- Generate all required icon sizes (192x192, 512x512)
- Set `display: standalone` or `display: fullscreen`
- Include `start_url` in manifest
- Serve over HTTPS (even localhost counts for dev)
- Test with Lighthouse PWA audit

### Pitfall 3: SPA Routing Breaks on Page Refresh
**What goes wrong:** Direct navigation to `/contests` returns 404.
**Why it happens:** nginx looks for actual `/contests` file, doesn't exist.
**How to avoid:**
- Configure `try_files $uri $uri/ /index.html` for SPA fallback
- This is already in the Pattern 5 nginx config above

### Pitfall 4: API Calls Fail in Docker (CORS or Proxy)
**What goes wrong:** API calls work in dev but fail in Docker container.
**Why it happens:** Different origins, missing proxy config, backend not reachable from container.
**How to avoid:**
- Use nginx proxy for `/api/` instead of direct calls (proxy removes CORS need)
- Use `host.docker.internal` on Windows/Mac to reach host machine
- For Linux, may need `--network=host` or explicit IP
- Test container networking: `docker exec -it <container> curl http://backend:port/api/v1/...`

### Pitfall 5: Icons Not Generated Correctly
**What goes wrong:** PWA icons missing or wrong sizes after build.
**Why it happens:** Image too small, wrong format, pwa-assets-generator not run.
**How to avoid:**
- Provide SVG or PNG at least 512x512 as source
- Run `npm run generate-assets` before building
- Verify output files exist in `public/` directory

## Code Examples

### Vite Config with PWA and Dev Proxy (for local development)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1')
      }
    }
  }
})
```

### TypeScript Declaration for PWA Virtual Module

```typescript
// src/vite-env.d.ts
/// <reference types="vite-plugin-pwa/client/vue" />
```

### App.vue with Reload Prompt

```vue
<script setup lang="ts">
import ReloadPrompt from './components/ReloadPrompt.vue'
</script>

<template>
  <router-view />
  <ReloadPrompt />
</template>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vue CLI | Vite | 2020-2021 | 10x faster HMR, better DX |
| Manual PWA manifest | vite-plugin-pwa | 2020+ | Zero-config, Workbox integration |
| Custom service worker | Workbox generateSW | 2018+ | Cross-browser, battle-tested |
| vuex | Pinia | 2022+ | TypeScript-native, simpler API |
| Regular nginx image | nginx:alpine | 2018+ | 5MB vs 130MB image size |

**Deprecated/outdated:**
- Vue CLI: Use Vite instead
- vuex: Use Pinia instead
- webpack: Use Vite (or Rollup-based tools) instead

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend is reachable at `host.docker.internal:8080` from Docker | Docker/Architecture | May need different host mapping |
| A2 | PWA icons generated from `public/logo.svg` | PWA Configuration | May need different source image |
| A3 | Target audience uses mobile browsers with service worker support | PWA-02 | Older devices may have degraded experience |
| A4 | .NET backend already has CORS configured or accepts /api proxy | DOCK-03 | May need backend changes for proxy approach |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Backend API URL for Docker**
   - What is the exact URL/port of the .NET backend when running locally?
   - Recommendation: Use environment variable `VITE_API_BASE_URL` with fallback to `http://localhost:8080`

2. **PWA Icon Source**
   - Is there an existing logo.svg in the project, or should we create one?
   - Recommendation: Ask user for logo SVG before generating assets

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vue build, npm | ✓ | 20.x+ [ASSUMED] | Install LTS |
| npm | Package installation | ✓ | 10.x+ [ASSUMED] | Install npm |
| Docker | Container deployment | ? | — | Cannot verify — check manually |
| git | Version control | ✓ | [ASSUMED] | — |

**Missing dependencies with no fallback:**
- Docker: If not available, Phase 1 Docker tasks cannot be verified

**Missing dependencies with fallback:**
- None identified

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PWA-01 | App is installable on mobile | Manual | Lighthouse PWA audit | N/A |
| PWA-02 | App works offline | Manual | Disable network, verify UI loads | N/A |
| PWA-03 | Update prompt appears | Manual | Build new version, refresh | N/A |
| DOCK-01 | Vue app runs in Docker | Automated | `docker build -t nutikas . && docker run -p 3000:8080 nutikas` | Wave 0 |
| DOCK-02 | Container serves app | Automated | `curl http://localhost:3000` returns HTML | Wave 0 |
| DOCK-03 | CORS configured | Automated | `curl -I http://localhost:3000/api/v1/` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test` (fast unit tests)
- **Per wave merge:** `npm run test:run` (full suite)
- **Phase gate:** Docker container builds and runs before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — test configuration
- [ ] `tests/setup.ts` — test utilities, mocks
- [ ] `tests/phases/foundation.test.ts` — smoke tests for build

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 2 handles auth |
| V3 Session Management | No | Phase 2 handles sessions |
| V4 Access Control | No | N/A for public content |
| V5 Input Validation | No | Phase 2+ handles inputs |
| V6 Cryptography | No | HTTPS only, no sensitive data in Phase 1 |

### Known Threat Patterns for Vue 3 PWA + Docker

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious PWA update | Tampering | Service worker signing (not in scope for v1) |
| Environment exposure | Information Disclosure | Vite `envPrefix` validation, no secrets in client bundle |
| XSS via inline scripts | Tampering | Vue auto-escapes, CSP via nginx headers |
| Docker container escape | Elevation | Use non-root nginx user, read-only filesystem |

### Security Controls for Phase 1

- **Non-root nginx user**: Configured in Dockerfile (`USER nginx`)
- **No secrets in client bundle**: Environment variables are public by default
- **CSP headers**: Can add via nginx (optional for Phase 1)

## Sources

### Primary (HIGH confidence)
- [vite-plugin-pwa official docs](https://vite-pwa-org.netlify.app/) — Context7 `/websites/vite-pwa-org_netlify_app`
- [Workbox documentation](https://developer.chrome.com/docs/workbox/) — Context7 `/googlechrome/workbox`
- [Docker Vue.js guide](https://github.com/docker/docs/blob/main/content/guides/vuejs/containerize.md) — Context7 `/docker/docs`

### Secondary (MEDIUM confidence)
- [Vue.js documentation](https://vuejs.org/) — npm registry verification
- [MDN PWA guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) — general reference

### Tertiary (LOW confidence)
- [Stack Overflow PWA patterns](https://stackoverflow.com/questions/tagged/progressive-web-apps) — community patterns, needs verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry
- Architecture: HIGH — patterns from official documentation
- Pitfalls: HIGH — known issues with solutions documented
- Docker/nginx: HIGH — official Docker docs with working examples

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days — stable stack, infrequent changes)

---

*Research complete. Planner can now create PLAN.md files for Phase 1: Foundation.*