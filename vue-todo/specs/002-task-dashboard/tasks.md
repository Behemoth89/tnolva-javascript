# Implementation Tasks: Task Dashboard

**Feature**: Task Dashboard  
**Branch**: `002-task-dashboard`  
**Date**: 2026-03-21

## Dependencies

```
Setup → Foundational → US1 (Dashboard View) → US2+US3 (Sort+Filter) → US7 (Create Task) → US4 (Statistics) → US5 (Priorities) → US6 (Categories) → US8 (UX) → US9 (Design) → US10 (404) → Polish
```

## Implementation Strategy

**MVP Scope**: User Story 1 (View Tasks Dashboard) - Core functionality first, then iterate

## Phase 1: Setup

- [ ] T001 Create TypeScript type definitions for Task, Priority, Category in src/types/
- [ ] T002 Create API service modules for tasks, priorities, categories in src/services/
- [ ] T003 Configure Vue Router with dashboard and settings routes in src/router/index.ts

## Phase 2: Foundational

- [ ] T004 Create Pinia store for tasks in src/stores/tasks.ts
- [ ] T005 Create Pinia store for priorities in src/stores/priorities.ts
- [ ] T006 Create Pinia store for categories in src/stores/categories.ts
- [ ] T007 Create Pinia store for UI state in src/stores/ui.ts
- [ ] T008 Create composable for infinite scroll in src/composables/useInfiniteScroll.ts

## Phase 3: User Story 1 - View Tasks Dashboard

- [ ] T009 [US1] Create DashboardView.vue in src/views/DashboardView.vue
- [ ] T010 [US1] Create TaskList.vue component in src/components/dashboard/TaskList.vue
- [ ] T011 [US1] Create TaskCard.vue component in src/components/dashboard/TaskCard.vue
- [ ] T012 [P] [US1] Create SkeletonLoader.vue component in src/components/dashboard/SkeletonLoader.vue
- [ ] T013 [US1] Implement task fetching and display in DashboardView

**Independent Test**: Load dashboard and verify all tasks display with title, priority, category, status, due date

## Phase 4: User Story 2 & 3 - Sort & Filter

- [ ] T014 [P] [US2] Create TaskSort.vue component in src/components/dashboard/TaskSort.vue
- [ ] T015 [P] [US3] Create TaskFilters.vue component in src/components/dashboard/TaskFilters.vue
- [ ] T016 [US2] Implement sorting logic in useSorting.ts composable
- [ ] T017 [US3] Implement filtering logic in useFiltering.ts composable
- [ ] T018 [US2] Connect sorting UI to tasks store
- [ ] T019 [US3] Connect filtering UI to tasks store
- [ ] T020 [US3] Display empty state when no tasks match filter

**Independent Test**: Apply each sort/filter option and verify tasks reorder/filter correctly

## Phase 5: User Story 7 - Create Task with Category Selection

- [ ] T021 [US7] Create TaskForm.vue component in src/components/dashboard/TaskForm.vue
- [ ] T022 [US7] Create CategorySelect.vue component in src/components/dashboard/CategorySelect.vue
- [ ] T023 [US7] Implement inline category creation in CategorySelect
- [ ] T024 [US7] Connect task creation form to store
- [ ] T025 [US7] Integrate task form into DashboardView

**Independent Test**: Create task with existing category, create task with new category, create task without category

## Phase 6: User Story 4 - Statistics

- [ ] T026 [P] [US4] Create StatisticsCard.vue component in src/components/dashboard/StatisticsCard.vue
- [ ] T027 [US4] Implement statistics calculation in tasks store
- [ ] T028 [US4] Display statistics cards on DashboardView

**Independent Test**: Verify total/pending/completed counts and completion % display correctly

## Phase 7: User Story 5 - Priorities CRUD

- [ ] T029 [US5] Create PrioritiesList.vue component in src/components/settings/PrioritiesList.vue
- [ ] T030 [P] [US5] Create PriorityForm.vue component in src/components/settings/PriorityForm.vue
- [ ] T031 [US5] Create SettingsView.vue in src/views/SettingsView.vue
- [ ] T032 [US5] Implement priority CRUD in priorities store and components
- [ ] T033 [US5] Integrate priorities management into SettingsView

**Independent Test**: Create, view, edit, delete priorities in settings

## Phase 8: User Story 6 - Categories CRUD

- [ ] T034 [P] [US6] Create CategoriesList.vue component in src/components/settings/CategoriesList.vue
- [ ] T035 [P] [US6] Create CategoryForm.vue component in src/components/settings/CategoryForm.vue
- [ ] T036 [US6] Implement category CRUD in categories store and components
- [ ] T037 [US6] Integrate categories management into SettingsView

**Independent Test**: Create, view, edit, delete categories in settings

## Phase 9: User Story 8 - Modern Dashboard UX

- [ ] T038 [US8] Add smooth transitions between views in src/App.vue
- [ ] T039 [US8] Add hover states and visual feedback to interactive elements
- [ ] T040 [US8] Implement optimistic UI updates for task completion
- [ ] T041 [US8] Add toast notifications for user actions in src/stores/ui.ts

**Independent Test**: Verify instant feedback, smooth transitions, hover states

## Phase 10: User Story 9 - Improved Visual Design

- [ ] T042 [US9] Update theme.css with enhanced dark & gold styling
- [ ] T043 [P] [US9] Add refined task card styling with shadows and borders
- [ ] T044 [P] [US9] Add polished statistics card styling
- [ ] T045 [US9] Apply consistent visual hierarchy across dashboard

**Independent Test**: Verify dark & gold theme consistency, visual hierarchy, polished design

## Phase 11: User Story 10 - Not Found Page

- [ ] T046 [US10] Create NotFoundView.vue in src/views/NotFoundView.vue
- [ ] T047 [US10] Configure wildcard route in src/router/index.ts
- [ ] T048 [US10] Add conditional home link based on auth status
- [ ] T049 [US10] Style 404 page with dark & gold theme

**Independent Test**: Navigate to non-existent route, verify 404 page with correct link

## Phase 12: Polish & Cross-Cutting

- [ ] T050 Add loading states for priority/category CRUD operations
- [ ] T051 Add error handling with toast notifications for all API calls
- [ ] T052 Add unit tests for stores (tasks, priorities, categories)
- [ ] T053 Add unit tests for key components
- [ ] T054 Run type-check and fix any TypeScript errors
- [ ] T055 Verify all tests pass

## Parallel Execution Opportunities

| Tasks      | Can Run In Parallel Because              |
| ---------- | ---------------------------------------- |
| T014, T015 | Different UI components, no dependencies |
| T012, T026 | Different components                     |
| T030, T034 | Different feature areas                  |
| T043, T044 | Different styling components             |

## Summary

| Phase | Description             | Task Count |
| ----- | ----------------------- | ---------- |
| 1     | Setup                   | 3          |
| 2     | Foundational            | 5          |
| 3     | US1 - Dashboard View    | 5          |
| 4     | US2+US3 - Sort & Filter | 7          |
| 5     | US7 - Create Task       | 5          |
| 6     | US4 - Statistics        | 3          |
| 7     | US5 - Priorities        | 5          |
| 8     | US6 - Categories        | 4          |
| 9     | US8 - Modern UX         | 4          |
| 10    | US9 - Visual Design     | 4          |
| 11    | US10 - Not Found        | 4          |
| 12    | Polish                  | 6          |

**Total Tasks**: 55

**MVP Scope**: Phase 1-6 (Tasks 1-30) - Core dashboard with tasks, sort, filter, create, statistics
