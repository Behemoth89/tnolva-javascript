<!-- GSD:project-start source:PROJECT.md -->
## Project

**React Todo App**

A school project — a React-based to-do application that connects to the TalTech API (taltech.akaver.com). Users can register, log in, and manage tasks with categories and priorities. The app features JWT authentication with automatic token refresh, a sidebar for category filtering, and a settings section for managing categories and priorities.

**Core Value:** Users can create, manage, and organize their tasks with categories and priorities through a clean, authenticated interface.

### Constraints

- **Tech stack**: React with Tailwind CSS and React Router — specified by user
- **API dependency**: Must work with the provided TalTech API — no backend changes possible
- **School project**: Needs to be well-structured and demonstrate good practices
- **Docker**: Must include Dockerfile and docker-compose for deployment
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.x | UI library | Current stable (19.2.4 released Jan 2026). Actions API, improved Suspense, compiler-driven performance. The standard for all new SPAs. |
| Vite | 8.0.x | Build tool | Released March 2026. Rolldown-powered builds, instant HMR, native ES modules. Replaces Create React App entirely — faster, lighter, better DX. |
| React Router | 7.14.x | Client-side routing | SPA mode via `ssr: false` in `react-router.config.ts`. Provides `BrowserRouter`, `clientLoader`/`clientAction` for data fetching, and `Navigate` for protected route redirects. |
| Tailwind CSS | 4.2.x | Utility-first CSS | Zero-runtime, Vite-native via `@tailwindcss/vite` plugin. No more `tailwind.config.js` — uses CSS-first configuration with `@theme`. Dramatically simpler setup than v3. |
| TypeScript | 5.7.x+ | Type safety | Required by all recommended libraries. Catches auth token type errors, API response shape mismatches before runtime. |
| Node.js | 20.19+ or 22.12+ | Runtime | Vite 8 minimum requirement. LTS versions with full ESM support. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Axios | 1.7.x+ | HTTP client | Always — needed for request/response interceptors to handle JWT token injection and auto-refresh on 401. Fetch API lacks built-in interceptor support. |
| Zustand | 5.0.x | State management | Always — lightweight (1KB), hook-based, no boilerplate. Use `persist` middleware to store tokens in localStorage across page reloads. |
| @heroicons/react | 2.2.x | SVG icon components | For priority icons, sidebar navigation icons, task status indicators. Made by Tailwind Labs — zero-config with Tailwind CSS. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| @vitejs/plugin-react | React Fast Refresh + HMR | Uses Oxc for React Refresh transforms (no Babel dependency). Include in `vite.config.ts`. |
| @tailwindcss/vite | Tailwind CSS Vite plugin | Replaces PostCSS-based Tailwind setup. Single plugin import in Vite config. |
| @types/react + @types/react-dom | TypeScript type definitions | Required for React 19 types. |
| TypeScript strict mode | Type checking | Enable `strict: true` in `tsconfig.json` — catches auth flow type errors early. |
### Deployment
| Technology | Purpose | Why |
|------------|---------|-----|
| nginx:stable-alpine | Production static file server | Minimal image (~23MB), battle-tested SPA hosting with `try_files` for client-side routing. |
| node:20-alpine | Build stage | Alpine-based for smaller image. Node 20 is Vite 8 minimum LTS. |
| Docker multi-stage build | Optimized production image | Build stage installs deps and runs `vite build`. Serve stage copies only `dist/` to nginx. Final image ~25MB vs ~300MB+ single stage. |
## Installation
# Core
# Build & styling
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Zustand | Redux Toolkit | Only if the project grows to need middleware chains, time-travel debugging, or team already knows Redux well. Overkill for a todo app. |
| Zustand | React Context + useReducer | Only for extremely simple state (just auth token). Zustand's `persist` middleware makes token persistence trivial — Context requires manual localStorage handling. |
| Axios | Fetch API + custom wrapper | Only if bundle size is critical (Axios adds ~13KB gzipped). For JWT with interceptors, Axios's built-in interceptor API is cleaner than wrapping Fetch. |
| React Router declarative mode | React Router framework mode | Only if SSR/SSG is needed later. For a pure SPA consuming an external API, declarative mode (`BrowserRouter`) or SPA mode (`ssr: false`) is simpler. |
| nginx:alpine | Caddy | Only if automatic HTTPS is needed. For Docker-local deployment, nginx is simpler and smaller. |
| Vite | esbuild directly | Only for minimal projects. Vite's plugin ecosystem (Tailwind, React) makes it the better choice. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App (CRA) | Officially deprecated. Slow builds, no HMR optimization, stuck on Webpack 4. | Vite 8 — 10-100x faster dev server, instant HMR, Rollup production builds. |
| Tailwind CSS v3 | Requires `tailwind.config.js`, PostCSS setup, `@tailwind` directives. v4 eliminates all of this. | Tailwind CSS v4 — CSS-first config via `@theme`, native Vite plugin, no PostCSS needed. |
| react-router-dom v6 | v7 is the current line. v6 is in maintenance mode. v7 adds SPA mode, `clientLoader`/`clientAction`, and better TypeScript. | React Router 7.x with SPA mode (`ssr: false`). |
| Redux | Boilerplate-heavy (slices, store setup, providers). 100+ lines of setup for what Zustand does in 10. | Zustand — single `create()` call, no providers, built-in persist middleware. |
| jsonwebtoken in browser | `jsonwebtoken` is a Node.js-only library. It will not work in the browser. | Use `jwt-decode` (v4.x) for decoding JWT claims client-side. It's a tiny utility that only decodes, never verifies. |
| Single-stage Docker builds | Includes Node.js, node_modules, and source code in production image. 300MB+ images with unnecessary attack surface. | Multi-stage: build in `node:20-alpine`, serve from `nginx:stable-alpine`. Final image ~25MB. |
| Timer-based token refresh | Refreshing on a fixed interval wastes requests and fails if the user's clock drifts. | Refresh on 401 response via Axios interceptor — only refresh when the server says the token is expired. |
## Stack Patterns by Variant
- Use React Router SPA mode (`ssr: false` in `react-router.config.ts`)
- Use `clientLoader` and `clientAction` for route-level data fetching
- Use `BrowserRouter` for declarative routing with `<Routes>` and `<Route>`
- Because there is no server to render — all data comes from the TalTech API
- Switch `ssr: true` in config, add `@react-router/node` dependency
- Routes with `loader` will server-render automatically
- Because React Router 7 is designed for this transition without UI changes
- Replace Axios with Fetch + custom interceptor wrapper (~13KB saved)
- Use `@heroicons/react` tree-shaking (only import needed icons)
- Because Vite 8 with Rolldown already optimizes tree-shaking, but HTTP client choice matters
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 19.2.x | React Router 7.14.x | React Router 7 bridges React 18 to 19. Fully compatible. |
| React 19.2.x | Zustand 5.0.x | Zustand 5 supports React 19 hooks natively. |
| Vite 8.0.x | Tailwind CSS 4.2.x | `@tailwindcss/vite` plugin is the recommended integration. |
| Vite 8.0.x | @vitejs/plugin-react 6.x | v6 uses Oxc for transforms, removes Babel dependency. |
| Node.js 20.19+ | Vite 8.0.x | Minimum required version. Node 22.12+ also supported. |
| Axios 1.7.x | Browser + Node | Interceptors work identically in both environments. |
## Sources
- `/vitejs/vite` — Vite 8 configuration, React plugin setup, build optimization (HIGH confidence)
- `/remix-run/react-router` — React Router 7 SPA mode, client loaders, protected routes (HIGH confidence)
- `/axios/axios-docs` — Axios interceptors, JWT token refresh pattern, error handling (HIGH confidence)
- `/pmndrs/zustand` — Zustand store setup, persist middleware, TypeScript patterns (HIGH confidence)
- https://react.dev/blog/2025/10/01/react-19-2 — React 19.2 release notes (HIGH confidence)
- https://github.com/vitejs/vite/releases/tag/v8.0.0 — Vite 8.0 release (HIGH confidence)
- https://reactrouter.com/7.13.1/how-to/spa — React Router SPA mode guide (HIGH confidence)
- https://tailwindcss.com/docs/installation — Tailwind CSS v4 Vite installation (HIGH confidence)
- https://dev.to/it-wibrc/guide-to-containerizing-a-modern-javascript-spa-vuevitereact-with-a-multi-stage-nginx-build-1lma — Multi-stage Docker + nginx SPA deployment (MEDIUM confidence)
- https://github.com/facebook/react/releases/tag/v19.2.4 — React 19.2.4 release (HIGH confidence)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
