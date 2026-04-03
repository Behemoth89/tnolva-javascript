# Phase 3: Todo Core - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create, view, edit, delete, and complete tasks organized by categories and priorities. Includes full CRUD for categories and priorities (Settings page built here). Loading states display during API operations and error states show user-friendly messages on failure.

Covers: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, CAT-01, CAT-02, CAT-03, PRI-01, PRI-02, PRI-03, INF-04, INF-05

</domain>

<decisions>
## Implementation Decisions

### Task List Layout
- **D-01:** Card-based layout for tasks (not table or simple list)
- **D-02:** Each card shows: task name, category, priority icon, due date, completion checkbox
- **D-03:** Cards follow existing zinc/amber design language (zinc-900/800 backgrounds, amber-500 accents)

### Task Form Pattern
- **D-04:** Modal dialog for creating and editing tasks (not inline form or separate page)
- **D-05:** Form fields: task name, category dropdown, priority dropdown, due date picker
- **D-06:** Modal accessible from a button in the main content area

### Category/Priority Management
- **D-07:** Full Settings page built in Phase 3 (not deferred to Phase 4)
- **D-08:** Settings page includes CRUD for both categories and priorities
- **D-09:** Phase 4 focuses on sidebar wiring, priority icons on tasks, and empty states instead

### State Management
- **D-10:** Dedicated Zustand stores for tasks, categories, and priorities (mirrors useAuthStore pattern)
- **D-11:** Stores handle loading states, error states, and data caching
- **D-12:** No React Query dependency — Zustand + direct API calls via apiClient

### Loading & Error States
- **D-13:** Loading states use the same spinner pattern as ProtectedRoute (amber-500 ring spinner)
- **D-14:** Error states use red-500 banner with user-friendly messages (consistent with auth pages)

### the agent's Discretion
- Exact card spacing and typography details
- Modal animation/transition approach
- Form validation rules beyond required fields
- Empty state design (Phase 4 handles empty states explicitly)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Task API
- `.planning/PROJECT.md` — API endpoint structure, task fields (taskName, taskSort, createdDt, dueDt, isCompleted, isArchived, todoCategoryId, todoPriorityId, syncDt)
- `.planning/REQUIREMENTS.md` — TASK-01 through TASK-05, CAT-01 through CAT-03, PRI-01 through PRI-03, INF-04, INF-05

### Category & Priority API
- `.planning/PROJECT.md` — Category fields (categoryName, categorySort, syncDt, tag) and Priority fields (priorityName, prioritySort, syncDt, tag)

### Auth & API Client (existing)
- `src/lib/apiClient.ts` — Axios client with JWT interceptors, use this for all API calls
- `src/stores/useAuthStore.ts` — Zustand store pattern to mirror for task/category/priority stores
- `src/types/auth.ts` — Type contract pattern to follow for task/category/priority types

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apiClient` (src/lib/apiClient.ts): Singleton Axios instance with JWT interceptors — use for all task/category/priority API calls
- `useAuthStore` (src/stores/useAuthStore.ts): Zustand + persist pattern to mirror for task data stores
- `ProtectedRoute` (src/components/ProtectedRoute.tsx): Loading spinner pattern (amber-500 ring) to reuse
- `DashboardPage` (src/features/dashboard/pages/DashboardPage.tsx): Already has sidebar + main layout structure — main content area is where task cards go
- Error banner pattern from LoginPage: `bg-red-500/10 border border-red-500/20` with `text-red-500`

### Established Patterns
- Feature-based directory structure: `src/features/{feature}/pages/`
- Type contracts in `src/types/`
- Stores in `src/stores/`
- Shared components in `src/components/`
- Dark theme: zinc-950 (page), zinc-900 (cards/nav), zinc-800 (borders), zinc-100 (text), zinc-400 (muted text)
- Accent color: amber-500
- Form validation: inline with touched state, error clearing on change

### Integration Points
- DashboardPage main content area → task card list
- DashboardPage sidebar placeholder → Phase 4 category filtering (leave as-is for now)
- Navbar → may need Settings link added (or deferred to Phase 4)
- apiClient → all task/category/priority API calls go through existing instance
- React Router (App.tsx) → new routes for Settings page

</code_context>

<specifics>
## Specific Ideas

- Settings page built in Phase 3 means Phase 4 is lighter — sidebar wiring + empty states + priority icons
- Task cards should feel consistent with the existing auth page aesthetic (clean, dark, amber accents)
- Modal form for tasks keeps the user in context — no page navigation needed

</specifics>

<deferred>
## Deferred Ideas

- Sidebar category filtering — Phase 4 (TASK-07)
- Priority icons on task cards — Phase 4 (TASK-06)
- Empty states for no tasks/categories/priorities — Phase 4 (INF-06)
- Task archiving — Out of scope (PROJECT.md)
- Task descriptions — Out of scope (PROJECT.md)

</deferred>

---

*Phase: 03-todo-core*
*Context gathered: 2026-04-03*
