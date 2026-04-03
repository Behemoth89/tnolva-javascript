# Phase 3: Todo Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 03-todo-core
**Areas discussed:** Task list layout, Task form pattern, Category/Priority management, State management approach

---

## Task List Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Card-based list | Each task as a card showing name, category badge, priority icon, due date, and completion checkbox. Consistent with existing zinc/amber design language. | ✓ |
| Table layout | Columnar table view — taskName | category | priority | due date | actions. More compact, good for scanning. | |
| Simple list with inline details | Minimal list rows that expand on hover/click to show more details. Lighter visual weight. | |

**User's choice:** Card-based list
**Notes:** Consistent with existing design language, cards show name, category, priority icon, due date, completion checkbox

## Task Form Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog | Overlay modal with form fields — name, category dropdown, priority dropdown, due date picker. Quick access from any page, doesn't break scroll position. | ✓ |
| Inline form at top of list | Form slides down or appears at the top of the task list. Simpler, but takes up space. | |
| Separate page/route | Navigate to /tasks/new and /tasks/:id/edit. Clear separation but extra navigation step. | |

**User's choice:** Modal dialog
**Notes:** Form fields: name, category dropdown, priority dropdown, due date picker

## Category/Priority Management

| Option | Description | Selected |
|--------|-------------|----------|
| Data layer only | Build Zustand store, API hooks, and type contracts. Phase 4 builds Settings UI on top. | |
| Simple inline management | Basic UI to add/edit/delete in dropdown or small panel. Phase 4 replaces with full Settings page. | |
| Full Settings page in Phase 3 | Build the complete Settings page now. Phase 4 focuses on sidebar wiring and integration. | ✓ |

**User's choice:** Full Settings page in Phase 3
**Notes:** Phase 4 becomes lighter — sidebar wiring, priority icons, empty states

## State Management

| Option | Description | Selected |
|--------|-------------|----------|
| Zustand store | Dedicated useTaskStore and useCategoryStore/usePriorityStore — mirrors existing useAuthStore pattern. Caching, cross-component sharing, loading/error state management. | ✓ |
| React hooks + local state | Custom hooks that manage their own loading/error/data state. Simpler for single-page use but no cross-component caching. | |
| React Query / TanStack Query | Industry-standard data fetching with caching, invalidation, and optimistic updates. Adds new dependency. | |

**User's choice:** Zustand store
**Notes:** Mirrors existing useAuthStore pattern, no React Query dependency

## the agent's Discretion

- Exact card spacing and typography details
- Modal animation/transition approach
- Form validation rules beyond required fields
- Empty state design (Phase 4 handles empty states explicitly)

## Deferred Ideas

- Sidebar category filtering — Phase 4
- Priority icons on task cards — Phase 4
- Empty states — Phase 4
- Task archiving — Out of scope
- Task descriptions — Out of scope
