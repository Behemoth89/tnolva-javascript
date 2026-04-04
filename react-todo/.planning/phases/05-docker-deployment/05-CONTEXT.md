# Phase 5: Docker Deployment - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

App can be deployed and run in a Docker container with docker-compose. Multi-stage Dockerfile and docker-compose for deployment. SPA routing must work correctly in production (nginx try_files).

</domain>

<decisions>
## Implementation Decisions

### Web server
- **D-01:** Use nginx:stable-alpine to serve the built SPA — minimal ~23MB image, battle-tested with try_files for client-side routing

### Multi-stage build
- **D-02:** Multi-stage Dockerfile — build stage uses node:20-alpine (install deps + vite build), serve stage uses nginx:stable-alpine (copy dist/ only)
- **D-03:** Final image ~25MB vs 300MB+ single-stage build

### API connectivity
- **D-04:** CORS only — no nginx reverse proxy to TalTech API. The SPA connects directly to taltech.akaver.com via CORS headers. Simpler nginx config, fewer moving parts.

### Environment configuration
- **D-05:** VITE_API_URL passed as Docker build ARG. Vite inlines it at build time. Simple, standard approach for a school project.

### Docker Compose
- **D-06:** Single web service only. TalTech API is external — no need to define it in compose.

### the agent's Discretion
- Exact nginx.conf structure (try_files $uri $uri/ /index.html is required)
- Build ARG default value for VITE_API_URL
- Port mapping in docker-compose (standard 80:80 or 8080:80)
- .dockerignore contents

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Infrastructure
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria (Dockerfile builds, docker-compose runs, SPA routing works)
- `.planning/REQUIREMENTS.md` — INF-03: App can be deployed via Docker with Dockerfile and docker-compose
- `.planning/STACK.md` — Deployment section: nginx:stable-alpine, node:20-alpine, multi-stage build patterns

### No external specs
No additional ADRs or feature specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vite.config.ts` — Vite configuration with React and Tailwind plugins. Build command: `npm run build` (tsc -b && vite build)
- `package.json` — scripts.build runs `tsc -b && vite build`, produces output to `dist/` by default
- `dist/` — Already exists from prior builds, will be the directory nginx serves

### Established Patterns
- Feature-based directory structure (src/features/) — no impact on Docker but good to know for build context
- Vite 8 with Rolldown builds — fast, standard output

### Integration Points
- `dist/` directory — output of `vite build`, input to nginx serve stage
- SPA routing — React Router declarative mode requires nginx try_files fallback to /index.html
- Vite env vars — VITE_API_URL must be available at build time (not runtime)

</code_context>

<specifics>
## Specific Ideas

- Multi-stage build should follow STACK.md recommendations: node:20-alpine for build, nginx:stable-alpine for serve
- Build ARG approach keeps Dockerfile CI/CD friendly — GitLab CI can pass different ARG values per environment

</specifics>

<deferred>
## Deferred Ideas

- GitLab CI/CD pipeline — user will add manually after this phase. The multi-stage build + build ARG approach is CI/CD compatible.
- Runtime environment injection — not needed for this project but would enable changing API URL without rebuild

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-docker-deployment*
*Context gathered: 2026-04-04*
