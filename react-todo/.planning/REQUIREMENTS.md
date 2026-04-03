# Requirements: React Todo App

**Defined:** 2026-04-03
**Core Value:** Users can create, manage, and organize their tasks with categories and priorities through a clean, authenticated interface.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can register with email, password, first name, and last name
- [ ] **AUTH-02**: User can log in with email and password
- [ ] **AUTH-03**: User can log out from any authenticated page
- [x] **AUTH-04**: JWT access token is automatically attached to all API requests
- [x] **AUTH-05**: Expired access token is automatically refreshed on 401 response without user action
- [ ] **AUTH-06**: User session is restored on page reload
- [ ] **AUTH-07**: Unauthenticated users are redirected to login when accessing protected routes
- [ ] **AUTH-08**: Authenticated users are redirected to dashboard when visiting login/register

### Task Management

- [ ] **TASK-01**: User can view a list of their tasks
- [ ] **TASK-02**: User can create a new task with name, category, priority, and due date
- [ ] **TASK-03**: User can edit an existing task's name, category, priority, and due date
- [ ] **TASK-04**: User can delete a task
- [ ] **TASK-05**: User can toggle task completion status
- [ ] **TASK-06**: Priority is displayed as an icon on each task
- [ ] **TASK-07**: Tasks can be filtered by category via the sidebar

### Categories & Priorities

- [ ] **CAT-01**: User can create a new task category with a name
- [ ] **CAT-02**: User can edit an existing category's name
- [ ] **CAT-03**: User can delete a task category
- [ ] **PRI-01**: User can create a new priority with a name and sort order
- [ ] **PRI-02**: User can edit an existing priority's name and sort order
- [ ] **PRI-03**: User can delete a priority

### Settings

- [ ] **SET-01**: User can access a settings page from the navigation
- [ ] **SET-02**: User can manage categories (CRUD) from the settings page
- [ ] **SET-03**: User can manage priorities (CRUD) from the settings page

### Infrastructure

- [ ] **INF-01**: App is styled with Tailwind CSS
- [ ] **INF-02**: App uses React Router for navigation between pages
- [ ] **INF-03**: App can be deployed via Docker with Dockerfile and docker-compose
- [ ] **INF-04**: Loading states are displayed during all API operations
- [ ] **INF-05**: Error states with user-friendly messages are displayed on API failures
- [ ] **INF-06**: Empty states are shown when no tasks, categories, or priorities exist

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Task Enhancements

- **TASK-08**: User can archive a task instead of deleting it
- **TASK-09**: User can add a description/notes field to a task
- **TASK-10**: User can bulk-complete or bulk-delete tasks

### Profile

- **PROF-01**: User can edit their first name, last name, and password in settings

### Notifications

- **NOTF-01**: User receives reminders for tasks with upcoming due dates
- **NOTF-02**: User can configure notification preferences

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Task descriptions | Adds form complexity; most users don't write them — defer to v2+ if validated |
| Task archiving | UI complexity, confuses users with "where did it go?" — API supports it, add later if needed |
| Profile editing in settings | Distracts from core settings purpose (categories/priorities) |
| Real-time collaboration | Massive complexity, different product — single-user API |
| Mobile app | Different tech stack — responsive web-first approach |
| Natural language input | Complex parsing, overkill for school project |
| AI scheduling/automation | Over-engineering, doesn't solve core problem |
| Habit tracking | Different domain, feature bloat |
| Pomodoro timer | Unrelated to task management |
| Calendar view | Different UI paradigm, complex scheduling logic |
| Search functionality | Unnecessary for small task lists |
| Export/import tasks | Data portability not critical yet |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| AUTH-08 | Phase 2 | Pending |
| TASK-01 | Phase 3 | Pending |
| TASK-02 | Phase 3 | Pending |
| TASK-03 | Phase 3 | Pending |
| TASK-04 | Phase 3 | Pending |
| TASK-05 | Phase 3 | Pending |
| TASK-06 | Phase 4 | Pending |
| TASK-07 | Phase 4 | Pending |
| CAT-01 | Phase 3 | Pending |
| CAT-02 | Phase 3 | Pending |
| CAT-03 | Phase 3 | Pending |
| PRI-01 | Phase 3 | Pending |
| PRI-02 | Phase 3 | Pending |
| PRI-03 | Phase 3 | Pending |
| SET-01 | Phase 4 | Pending |
| SET-02 | Phase 4 | Pending |
| SET-03 | Phase 4 | Pending |
| INF-01 | Phase 1 | Pending |
| INF-02 | Phase 1 | Pending |
| INF-03 | Phase 5 | Pending |
| INF-04 | Phase 3 | Pending |
| INF-05 | Phase 3 | Pending |
| INF-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after initial definition*
