# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-04
**Phases:** 5 | **Plans:** 16 | **Sessions:** ~10

### What Was Built
- Full React SPA with JWT authentication (login, register, protected routes, session persistence)
- Task CRUD with categories, priorities, due dates, and completion toggling
- Settings page for category/priority management
- Sidebar with category filtering, date range, and completed toggle
- Docker deployment with multi-stage build (~25MB nginx image)

### What Worked
- GSD workflow with phased planning → execution → verification kept scope tight
- Feature-based directory structure scaled cleanly from 1 to 5 phases
- Zustand stores with centralized API client avoided prop drilling and duplicated fetch logic
- Multi-stage Docker build produced a production-ready 25MB image
- npm install instead of npm ci in Dockerfile resolved version mismatch gracefully

### What Was Inefficient
- Test type definitions (@testing-library/jest-dom) were missing — LSP errors across all test files went unresolved
- STATE.md accumulated duplicate decision entries and stale performance logs that needed cleanup at milestone
- ROADMAP.md progress table was never updated after phase completions (showed "Not started" for phases 3-5)
- No formal UAT testing was run before milestone completion — relied on Docker smoke test only

### Patterns Established
- Feature-based directory structure (src/features/) for all new features
- Zustand stores with apiClient integration, no persist on data stores (fresh fetch on mount)
- Axios interceptors for JWT injection and 401 auto-refresh
- PLAN.md → SUMMARY.md workflow for all phase execution
- Multi-stage Dockerfile (node:20-alpine → nginx:stable-alpine) for all future deployments

### Key Lessons
1. Run `npm install` before Docker builds when local npm version differs from container npm — lock file format incompatibility causes silent failures
2. Update ROADMAP.md progress table during phase transitions, not just at milestone — stale data hides real progress
3. Test type definitions should be verified in Phase 1 — leaving them broken for 4 phases compounds the debt
4. Docker smoke testing (curl HTTP checks) is a good minimum but doesn't replace UAT for actual user flows

### Cost Observations
- Sessions: ~10 across 56 days (avg 11 days/phase, but most work happened in last 2 days)
- Notable: Phases 1-4 completed in rapid succession on 2026-04-03, Phase 5 on 2026-04-04 — burst execution pattern

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~10 | 5 | Initial GSD workflow established |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 5 files | Unknown | 0 (test types broken) |

### Top Lessons (Verified Across Milestones)

1. Lock file sync matters — always verify `npm ci` works in the target environment before relying on it
2. ROADMAP.md is only useful if kept current — automate progress updates during phase transitions
3. Docker deployment should happen earlier in the cycle, not as the last phase — catches integration issues sooner
