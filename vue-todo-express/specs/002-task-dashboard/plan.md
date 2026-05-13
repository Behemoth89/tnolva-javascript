# Implementation Plan: Task Dashboard

**Branch**: `002-task-dashboard` | **Date**: 2026-03-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-task-dashboard/spec.md`

## Summary

Build a modern Vue 3 task dashboard with sorting, filtering, statistics, CRUD for priorities/categories, and improved dark/gold theme. The dashboard displays tasks with infinite scroll, skeleton loaders for loading states, and error handling with retry capability. Includes a custom 404 page for wildcard routes.

## Technical Context

**Language/Version**: TypeScript 5.9+  
**Primary Dependencies**: Vue 3.5+, Vite 7+, Pinia 3+, Vue Router 5+, Vitest 4+  
**Storage**: N/A (frontend-only, data persisted via external API at taltech.akaver.com)  
**Testing**: Vitest 4+ with @vue/test-utils  
**Target Platform**: Web browser (modern browsers, ES2020+)  
**Project Type**: Web application (frontend SPA)  
**Performance Goals**: Dashboard load <2s, sort/filter <500ms, infinite scroll lazy loading  
**Constraints**: Must pass `vue-tsc --build` (TypeScript strict mode), Component-First Architecture, Spec-Driven Development  
**Scale/Scope**: Single user task management (typical 10-100 tasks, supports 100+ with infinite scroll)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                         | Status  | Notes                                     |
| ---------------------------- | ------- | ----------------------------------------- |
| TypeScript Strict Mode       | ✅ PASS | All new code must pass vue-tsc --build    |
| Component-First Architecture | ✅ PASS | Features as self-contained Vue components |
| Spec-Driven Development      | ✅ PASS | Implementation follows spec.md exactly    |
| Automated Testing            | ✅ PASS | Unit tests for components/stores required |
| Single Responsibility        | ✅ PASS | Components <200 lines, single purpose     |

## Project Structure

### Documentation (this feature)

```
specs/002-task-dashboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
└── checklists/          # Requirements validation
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── dashboard/       # Dashboard components
│   │   ├── TaskList.vue
│   │   ├── TaskCard.vue
│   │   ├── TaskFilters.vue
│   │   ├── TaskSort.vue
│   │   ├── StatisticsCard.vue
│   │   └── SkeletonLoader.vue
│   ├── settings/        # Settings components
│   │   ├── PrioritiesList.vue
│   │   ├── CategoriesList.vue
│   │   └── SettingsLayout.vue
│   ├── layout/          # Layout components
│   │   ├── AppHeader.vue
│   │   └── NotFound.vue # 404 page
│   └── ui/              # Shared UI components
│       ├── Button.vue
│       ├── Input.vue
│       ├── Select.vue
│       ├── Modal.vue
│       ├── Toast.vue
│       └── Card.vue
├── views/
│   ├── DashboardView.vue
│   ├── SettingsView.vue
│   └── NotFoundView.vue
├── stores/
│   ├── tasks.ts         # Task state management
│   ├── priorities.ts    # Priorities CRUD
│   ├── categories.ts   # Categories CRUD
│   └── ui.ts           # UI state (loading, errors, toasts)
├── composables/
│   ├── useTasks.ts      # Task operations
│   ├── useSorting.ts   # Sorting logic
│   ├── useFiltering.ts # Filtering logic
│   └── useInfiniteScroll.ts
├── services/
│   ├── api.service.ts  # Base API calls (already exists)
│   ├── task.service.ts # Task-specific API calls
│   ├── priority.service.ts
│   └── category.service.ts
├── types/
│   ├── task.ts
│   ├── priority.ts
│   └── category.ts
└── router/
    └── index.ts         # Vue Router config with wildcard route

tests/
├── unit/
│   ├── components/
│   ├── stores/
│   └── composables/
└── e2e/ (if needed)
```

**Structure Decision**: Single project Vue 3 SPA with component-first architecture. Uses existing src/ directory structure with new subdirectories for dashboard, settings, and layout components. All new components must be independently testable.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

## Phase 0: Research

_All NEEDS CLARIFICATION resolved during spec phase. No additional research required._

## Phase 1: Design

### Data Model

See [data-model.md](data-model.md) for entity definitions.

### API Contracts

The frontend consumes existing API endpoints:

- `GET /api/v1/TodoTasks` - List tasks
- `POST /api/v1/TodoTasks` - Create task
- `PUT /api/v1/TodoTasks/{id}` - Update task
- `DELETE /api/v1/TodoTasks/{id}` - Delete task
- `GET /api/v1/TodoCategories` - List categories
- `POST /api/v1/TodoCategories` - Create category
- `PUT /api/v1/TodoCategories/{id}` - Update category
- `DELETE /api/v1/TodoCategories/{id}` - Delete category
- `GET /api/v1/TodoPriorities` - List priorities
- `POST /api/v1/TodoPriorities` - Create priority
- `PUT /api/v1/TodoPriorities/{id}` - Update priority
- `DELETE /api/v1/TodoPriorities/{id}` - Delete priority

No external interfaces exposed - this is a frontend-only application.

### Quick Start

See [quickstart.md](quickstart.md) for development setup.

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
