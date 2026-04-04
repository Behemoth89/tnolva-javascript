# Phase 4: Settings & Integration - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Users have a dedicated settings page for managing categories/priorities and can filter tasks via the sidebar. Priority is displayed as an icon on each task. Empty states are shown when no tasks, categories, or priorities exist.

Covers: TASK-06, TASK-07, SET-01, SET-02, SET-03, INF-06

**Already built (Phase 3 build-ahead):** Settings page with tabbed CRUD for categories/priorities, Settings route and Navbar link, Zustand stores for tasks/categories/priorities, type definitions, basic inline empty state text.

**Remaining work:** Sidebar component with category filtering, priority icons on task cards, reusable EmptyState component, due date filtering, completed task filtering, navbar Home link.

</domain>

<decisions>
## Implementation Decisions

### Sidebar Filtering Behavior
- **D-01:** Multi-select category filtering with checkboxes — users can select multiple categories simultaneously
- **D-02:** Sidebar always shows "All Tasks" (resets filter) at top and "Uncategorized" (tasks with no category) at bottom
- **D-03:** Task counts displayed next to each category (e.g., "Work (5)")
- **D-04:** Selected categories highlighted with amber-500 row background/text for visual indication
- **D-05:** Category data fetched on DashboardPage mount via useCategoryStore.fetchCategories() — not in Sidebar component itself

### Priority Icon Design
- **D-06:** Priority displayed as icon with text revealed on hover (tooltip) — not a permanent text badge
- **D-07:** FlagIcon from @heroicons/react used for all priority levels
- **D-08:** Priority colors determined by prioritySort order from API — lowest sort = red (urgent), middle = amber, highest = green

### Empty State Approach
- **D-09:** Reusable EmptyState component created and used across TaskList, CategoryManager, PriorityManager, and filtered views
- **D-10:** EmptyState contains: icon at top, title text, optional subtitle text (icon + title + subtitle pattern)
- **D-11:** Filtered empty state needed: "No tasks in this category" variant for when category filter returns no results

### State Management for Filtering
- **D-12:** Selected category IDs stored in useTaskStore (global state, not local DashboardPage state)
- **D-13:** Category filter persists across page reloads via Zustand persist middleware
- **D-14:** Selected due date range stored in useTaskStore alongside category filter — also persisted
- **D-15:** Show completed toggle stored in useTaskStore — also persisted

### Due Date Filtering
- **D-16:** Due date filter placed as a section in the same sidebar, below the categories section
- **D-17:** Single-select date range — pick one range at a time (e.g., "Today", "This Week", "Next Week", "Overdue", "No Date")
- **D-18:** Due date filter can be combined with category multi-select (intersection logic)

### Completed Task Filtering
- **D-19:** "Show completed" checkbox toggle placed in the sidebar
- **D-20:** Completed tasks hidden by default — checkbox unchecked = only uncompleted tasks shown
- **D-21:** Completed tasks sorted to the end of the list — uncompleted tasks always shown first, then completed, then whatever other sorting is applied
- **D-22:** Show completed preference persisted in useTaskStore

### Navbar Navigation
- **D-23:** Home/Dashboard link added to Navbar using house icon from @heroicons/react — enables navigation back to dashboard from Settings and other pages

### the agent's Discretion
- Exact sidebar width and responsive behavior
- Specific date range labels and date calculation logic
- Exact EmptyState icon choices per scenario
- Priority color exact hex values (use Tailwind red-500, amber-500, green-500 or similar)
- Modal animation/transition approach

### Folded Todos
None — no pending todos matched this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Task API
- `.planning/PROJECT.md` — API endpoint structure, task fields (taskName, taskSort, createdDt, dueDt, isCompleted, isArchived, todoCategoryId, todoPriorityId, syncDt)
- `.planning/REQUIREMENTS.md` — TASK-06, TASK-07, SET-01, SET-02, SET-03, INF-06
- **Swagger API** — `GET/POST /api/v1/TodoTasks`, `GET/PUT/DELETE /api/v1/TodoTasks/{id}`

### Category & Priority API
- `.planning/PROJECT.md` — Category fields (categoryName, categorySort, syncDt, tag) and Priority fields (priorityName, prioritySort, syncDt, tag)
- **Swagger API** — `GET/POST /api/v1/TodoCategories`, `GET/PUT/DELETE /api/v1/TodoCategories/{id}`
- **Swagger API** — `GET/POST /api/v1/TodoPriorities`, `GET/PUT/DELETE /api/v1/TodoPriorities/{id}`

### Existing Code (must read before planning)
- `src/stores/useTaskStore.ts` — Current task store structure, needs extension for filter state
- `src/stores/useCategoryStore.ts` — Category store to mirror for sidebar data
- `src/features/dashboard/pages/DashboardPage.tsx` — Main layout with empty sidebar placeholder
- `src/features/dashboard/components/TaskCard.tsx` — Current priority display as text badge, needs icon replacement
- `src/features/dashboard/components/TaskList.tsx` — Task list component, needs filtering logic
- `src/components/Navbar.tsx` — Navbar component, needs Home link added
- `src/lib/apiClient.ts` — Axios client with JWT interceptors, use for all API calls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apiClient` (src/lib/apiClient.ts): Singleton Axios instance with JWT interceptors — use for all API calls
- `useTaskStore` (src/stores/useTaskStore.ts): Existing task store — extend with selectedCategoryIds, selectedDateRange, showCompleted state
- `useCategoryStore` (src/stores/useCategoryStore.ts): Already fetches categories — sidebar can consume this directly
- `DashboardPage` (src/features/dashboard/pages/DashboardPage.tsx): Has sidebar + main layout structure, `<aside>` is empty placeholder
- `TaskCard.tsx` (src/features/dashboard/components/TaskCard.tsx): Currently shows priority as text badge — replace with icon
- `TaskList.tsx` (src/features/dashboard/components/TaskList.tsx): Renders all tasks unconditionally — needs filter props
- `@heroicons/react`: Installed (v2.2.0) but never imported — ready for FlagIcon, HomeIcon, etc.

### Established Patterns
- Feature-based directory structure: `src/features/{feature}/pages/` and `src/features/{feature}/components/`
- Type contracts in `src/types/`
- Stores in `src/stores/`
- Shared components in `src/components/`
- Dark theme: zinc-950 (page), zinc-900 (cards/nav), zinc-800 (borders), zinc-100 (text), zinc-400 (muted text)
- Accent color: amber-500
- Zustand + persist pattern for state (useAuthStore)
- Loading spinner: amber-500 ring (ProtectedRoute pattern)
- Error banner: `bg-red-500/10 border border-red-500/20` with `text-red-500`

### Integration Points
- DashboardPage `<aside>` element → new Sidebar component with category checkboxes, due date selector, completed toggle
- TaskList → receives filter state (selected categories, date range, show completed) and filters tasks before rendering
- TaskCard → priority badge replaced with FlagIcon + hover tooltip
- Navbar → add Home/Dashboard link
- useTaskStore → add selectedCategoryIds (string[]), selectedDateRange (string | null), showCompleted (boolean), all with persist
- EmptyState component → new shared component in `src/components/` or `src/features/dashboard/components/`

</code_context>

<specifics>
## Specific Ideas

- "Filter out completed tasks by default — only uncompleted tasks shown"
- "Completed tasks should be sorted to the end, so even when looking all tasks, uncompleted tasks are shown on top"
- "Can't navigate back to dashboard from settings — need Home button in Navbar"
- Due date filter examples: "this week", "next week", etc.
- Settings page already built in Phase 3 — Phase 4 is lighter (sidebar wiring + icons + empty states + filters)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 04-settings-integration*
*Context gathered: 2026-04-04*
