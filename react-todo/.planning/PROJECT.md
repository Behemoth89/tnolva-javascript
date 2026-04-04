# React Todo App

## What This Is

A school project — a React-based to-do application that connects to the TalTech API (taltech.akaver.com). Users can register, log in, and manage tasks with categories and priorities. The app features JWT authentication with automatic token refresh, a sidebar for category filtering, and a settings section for managing categories and priorities. Deployed via Docker with multi-stage builds (~25MB image).

## Core Value

Users can create, manage, and organize their tasks with categories and priorities through a clean, authenticated interface.

## Requirements

### Validated

- ✓ User registration with email, password, first name, last name — v1.0
- ✓ User login with email and password — v1.0
- ✓ User logout functionality — v1.0
- ✓ JWT token handling with auto-refresh on 401 responses — v1.0
- ✓ Protected routes — unauthenticated users redirected to login — v1.0
- ✓ Todo dashboard to view, add, and edit tasks — v1.0
- ✓ Task creation with name, category, priority, and due date — v1.0
- ✓ Task editing and deletion — v1.0
- ✓ Task completion toggle — v1.0
- ✓ Task filtering by category via sidebar — v1.0
- ✓ Priority display with icons on tasks — v1.0
- ✓ Settings section with CRUD for task categories — v1.0
- ✓ Settings section with CRUD for task priorities — v1.0
- ✓ Docker deployment with Dockerfile and docker-compose — v1.0
- ✓ Tailwind CSS styling — v1.0
- ✓ React Router for navigation between pages — v1.0

### Active

(Empty — awaiting next milestone planning)

### Out of Scope

- Profile editing in settings — keeping settings focused on categories and priorities only
- Task descriptions — task form limited to name, category, priority, and due date
- Task archiving — not required for v1
- Mobile app — web-first approach
- Real-time collaboration — single-user todo app

## Context

**Shipped v1.0** — 5 phases, 16 plans, 27 tasks across 56 days (2026-02-07 → 2026-04-04).

**Tech stack:** React 19.2, Vite 8, TypeScript 5.7, Tailwind CSS 4.2, React Router 7.14, Zustand 5.0, Axios 1.7.

**API:** TalTech API at https://taltech.akaver.com with OpenAPI spec. All authenticated endpoints working with JWT interceptors and auto-refresh.

**Deployment:** Multi-stage Docker (node:20-alpine → nginx:stable-alpine), ~25MB final image, docker-compose on port 8080.

**Codebase:** Feature-based directory structure (src/features/), Zustand stores for auth/tasks/categories/priorities, centralized API client with interceptors.

**This is a school project** — demonstrates competency with React, authentication, state management, and API integration.

## Constraints

- **Tech stack**: React with Tailwind CSS and React Router — specified by user
- **API dependency**: Must work with the provided TalTech API — no backend changes possible
- **School project**: Needs to be well-structured and demonstrate good practices
- **Docker**: Must include Dockerfile and docker-compose for deployment

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Auto-refresh on 401 | Better UX than timer-based or manual refresh — only refresh when needed | ✓ Shipped v1.0 |
| Tailwind CSS for styling | Modern, utility-first approach common in React projects | ✓ Shipped v1.0 |
| React Router for navigation | Standard client-side routing with protected routes support | ✓ Shipped v1.0 |
| Sidebar for category filtering | Clean separation of navigation and content | ✓ Shipped v1.0 |
| Priority icons over badges | Visual distinction through icons rather than colored text | ✓ Shipped v1.0 |
| Docker + docker-compose | Easy deployment and consistent environment | ✓ Shipped v1.0 |
| Settings limited to categories/priorities | Keeps settings focused, avoids scope creep | ✓ Shipped v1.0 |
| Feature-based organization over flat structure | Scales as app grows with multiple features | ✓ Shipped v1.0 |
| No persist middleware on todo stores | Data should always be fetched fresh from API on mount | ✓ Shipped v1.0 |
| window.confirm for delete confirmation | Simple, no extra component needed | ✓ Shipped v1.0 |
| Partialize persist config for filters only | Only filter preferences survive page reload, not tasks | ✓ Shipped v1.0 |
| useMemo for filtering | Avoid expensive recalculation on every render | ✓ Shipped v1.0 |
| npm install over npm ci in Dockerfile | npm version mismatch between local (11.x) and container (10.x) | ✓ Shipped v1.0 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-04 after v1.0 milestone*
