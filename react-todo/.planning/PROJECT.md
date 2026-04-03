# React Todo App

## What This Is

A school project — a React-based to-do application that connects to the TalTech API (taltech.akaver.com). Users can register, log in, and manage tasks with categories and priorities. The app features JWT authentication with automatic token refresh, a sidebar for category filtering, and a settings section for managing categories and priorities.

## Core Value

Users can create, manage, and organize their tasks with categories and priorities through a clean, authenticated interface.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User registration with email, password, first name, last name
- [ ] User login with email and password
- [ ] User logout functionality
- [ ] JWT token handling with auto-refresh on 401 responses
- [ ] Protected routes — unauthenticated users redirected to login
- [ ] Todo dashboard to view, add, and edit tasks
- [ ] Task creation with name, category, priority, and due date
- [ ] Task editing and deletion
- [ ] Task completion toggle
- [ ] Task filtering by category via sidebar
- [ ] Priority display with icons on tasks
- [ ] Settings section with CRUD for task categories
- [ ] Settings section with CRUD for task priorities
- [ ] Docker deployment with Dockerfile and docker-compose
- [ ] Tailwind CSS styling
- [ ] React Router for navigation between pages

### Out of Scope

- Profile editing in settings — keeping settings focused on categories and priorities only
- Task descriptions — task form limited to name, category, priority, and due date
- Task archiving — not required for v1
- Mobile app — web-first approach
- Real-time collaboration — single-user todo app

## Context

**API:** TalTech API at https://taltech.akaver.com with OpenAPI spec available.
- Account endpoints: Register, Login, RefreshToken
- TodoTasks: Full CRUD with fields: taskName, taskSort, createdDt, dueDt, isCompleted, isArchived, todoCategoryId, todoPriorityId, syncDt
- TodoCategories: Full CRUD with fields: categoryName, categorySort, syncDt, tag
- TodoPriorities: Full CRUD with fields: priorityName, prioritySort, syncDt, tag
- ListItems: Separate endpoint for simple list items (description, completed)

**Authentication flow:**
- Login/Register returns: token, refreshToken, firstName, lastName
- Refresh endpoint requires: jwt and refreshToken
- Bearer token scheme for all authenticated requests
- API version parameter in path (v1)

**This is a school project** — needs to demonstrate competency with React, authentication, state management, and API integration.

## Constraints

- **Tech stack**: React with Tailwind CSS and React Router — specified by user
- **API dependency**: Must work with the provided TalTech API — no backend changes possible
- **School project**: Needs to be well-structured and demonstrate good practices
- **Docker**: Must include Dockerfile and docker-compose for deployment

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Auto-refresh on 401 | Better UX than timer-based or manual refresh — only refresh when needed | — Pending |
| Tailwind CSS for styling | Modern, utility-first approach common in React projects | — Pending |
| React Router for navigation | Standard client-side routing with protected routes support | — Pending |
| Sidebar for category filtering | Clean separation of navigation and content | — Pending |
| Priority icons over badges | Visual distinction through icons rather than colored text | — Pending |
| Docker + docker-compose | Easy deployment and consistent environment | — Pending |
| Settings limited to categories/priorities | Keeps settings focused, avoids scope creep | — Pending |

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
*Last updated: 2026-04-03 after initialization*
