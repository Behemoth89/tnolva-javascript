# Roadmap: React Todo App

## Overview

Build a React-based to-do application that connects to the TalTech API (taltech.akaver.com). Users register, log in, and manage tasks with categories and priorities. The app features JWT authentication with automatic token refresh, a sidebar for category filtering, and a settings section for managing categories and priorities. Deployed via Docker.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & API Client** - Project scaffolding, Tailwind CSS setup, and centralized Axios client with JWT interceptors
- [x] **Phase 2: Authentication UI** - Login, register, logout flows with protected routes and session management
- [ ] **Phase 3: Todo Core** - Task CRUD, category/priority management, filtering, loading and error states
- [ ] **Phase 4: Settings & Integration** - Settings page, sidebar wiring, priority icons, empty states
- [ ] **Phase 5: Docker Deployment** - Multi-stage Dockerfile and docker-compose for deployment

## Phase Details

### Phase 1: Foundation & API Client
**Goal**: Project scaffolding is ready and all API calls go through a centralized client with automatic JWT handling
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-04, AUTH-05, INF-01, INF-02
**Success Criteria** (what must be TRUE):
  1. App runs locally with Vite dev server and Tailwind CSS styling applied
  2. React Router navigates between placeholder pages without errors
  3. All API requests automatically include the Bearer access token
  4. Expired access tokens are automatically refreshed on 401 without user action
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Vite + React + Tailwind CSS project, create placeholder pages and router
- [x] 01-02-PLAN.md — Create Zustand auth store with persist middleware and auth type contracts
- [x] 01-03-PLAN.md — Create Axios API client factory with JWT interceptors and queued retry on 401

### Phase 2: Authentication UI
**Goal**: Users can securely create accounts, log in, and access protected areas with persistent sessions
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-06, AUTH-07, AUTH-08
**Success Criteria** (what must be TRUE):
  1. User can register with email, password, first name, and last name
  2. User can log in with email and password and see the dashboard
  3. User can log out from any authenticated page
  4. User session is restored on page reload (stays logged in)
  5. Unauthenticated users are redirected to login; authenticated users are redirected to dashboard when visiting login/register
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Login page with form, validation, API integration; PublicRoute wrapper for authenticated user redirect
- [x] 02-02-PLAN.md — Registration page with 5 fields, password confirmation validation, API integration
- [x] 02-03-PLAN.md — Protected route guard, dashboard navbar with greeting/logout, session persistence, rehydration loading

**UI hint**: yes

### Phase 3: Todo Core
**Goal**: Users can create, view, edit, delete, and complete tasks organized by categories and priorities
**Depends on**: Phase 2
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, CAT-01, CAT-02, CAT-03, PRI-01, PRI-02, PRI-03, INF-04, INF-05
**Success Criteria** (what must be TRUE):
  1. User can view a list of their tasks
  2. User can create, edit, and delete tasks with name, category, priority, and due date
  3. User can toggle task completion status
  4. User can create, edit, and delete task categories and priorities
  5. Loading states display during API operations and error states show user-friendly messages on failure
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Create TypeScript type contracts for tasks, categories, and priorities
- [ ] 03-02-PLAN.md — Create Zustand stores for tasks, categories, and priorities with CRUD operations
- [ ] 03-03-PLAN.md — Build task UI components (cards, list, modal) and wire into DashboardPage
- [ ] 03-04-PLAN.md — Build Settings page with category/priority CRUD management and add route
**UI hint**: yes

### Phase 4: Settings & Integration
**Goal**: Users have a dedicated settings page for managing categories/priorities and can filter tasks via the sidebar
**Depends on**: Phase 3
**Requirements**: TASK-06, TASK-07, SET-01, SET-02, SET-03, INF-06
**Success Criteria** (what must be TRUE):
  1. User can access a settings page from navigation
  2. User can manage categories and priorities (CRUD) from the settings page
  3. Tasks are filtered by selected category via the sidebar
  4. Priority is displayed as an icon on each task
  5. Empty states are shown when no tasks, categories, or priorities exist
**Plans**: TBD
**UI hint**: yes

### Phase 5: Docker Deployment
**Goal**: App can be deployed and run in a Docker container with docker-compose
**Depends on**: Phase 4
**Requirements**: INF-03
**Success Criteria** (what must be TRUE):
  1. App builds successfully via Dockerfile
  2. App runs and is accessible via docker-compose
  3. SPA routing works correctly in production (nginx try_files)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & API Client | 3/3 | Complete | 2026-04-03 |
| 2. Authentication UI | 3/3 | Complete | 2026-04-03 |
| 3. Todo Core | 0/0 | Not started | - |
| 4. Settings & Integration | 0/0 | Not started | - |
| 5. Docker Deployment | 0/0 | Not started | - |
