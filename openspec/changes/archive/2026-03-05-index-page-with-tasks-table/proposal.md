## Why

Currently, when the application opens, it immediately redirects to a settings-based interface with a sidebar navigation. Users need a dedicated index/home page that displays tasks in a table view with sorting, filtering, statistics, and the ability to add new tasks - all without navigating through settings.

## What Changes

1. **New Index Page** - Create a dedicated index/home page (`/`) that shows tasks in a sortable/filterable table (default route)
2. **Collapsible Sidebar** - Sidebar visible on all pages with toggle button to collapse/expand
3. **Sidebar Tasks Link** - Add "Tasks" (Home) link to sidebar navigation pointing to index page
4. **Sortable Table Headers** - All table columns (status, title, category, description, tags, start date, due date, actions) are sortable using existing `TableSorter` utility
5. **Filterable Table** - Use existing `FilterController` and `applyTableFilter` utilities for column filtering
6. **Date Range Filter** - Add start date and end date filters to filter tasks where date falls between both dates (inclusive), with helper dropdown for quick presets (Today, This week, Next week, This month, Next month, This year)
7. **Statistics Display** - Show count of filtered tasks and count of high priority filtered tasks
8. **Add Task Modal** - Add task functionality with filterable dropdowns for categories and task dependencies using `createSearchableDropdown`
9. **Inline Category Creation** - Add "Add New Category" button in task add form that opens a quick category creation dialog
10. **Task Actions on Index Page** - Edit and delete tasks directly from the index table
11. **BLL DTO Pattern** - Expand BLL DTO pattern to all services (currently only TaskService uses BLL DTOs). Create DTOs and update CategoryService, TaskDependencyService, RecurrenceService, RecurringTaskService to use DTOs.
12. **Update UI Bridge** - Update UiBridge to work with new BLL DTOs across all services

## Capabilities

### New Capabilities
- `tasks-index-table`: Sortable/filterable task table on index page with columns: status, title, category, description, tags, start date, due date, actions
- `date-range-filter`: Filter tasks by date range (start and end date) with inclusive comparison
- `task-statistics-panel`: Display count of all filtered tasks and count of high priority filtered tasks
- `task-add-modal`: Modal form for adding new tasks with searchable dropdowns for category and dependencies
- `category-inline-create`: Allow creating new categories from within the task add modal when suitable category not found
- `task-index-actions`: Edit and delete tasks directly from index table
- `collapsible-sidebar`: Collapsible sidebar visible on all pages with Tasks (Home) link
- `bll-dto-pattern`: Expand BLL DTO pattern to CategoryService, TaskDependencyService, RecurrenceService, RecurringTaskService
- `ui-bridge-dto-update`: Update UiBridge to use BLL DTOs for all services

### Modified Capabilities
- None - using existing services (TaskService, CategoryService, StatisticsService, TaskDependencyService) without changing their requirements

## Impact

- **New Files**: 
  - Index page component (`src/ui/pages/index.ts`), index styles
  - BLL DTOs for CategoryService, TaskDependencyService, RecurrenceService, RecurringTaskService
- **Modified Files**: 
  - Router (`src/ui/scripts/router.ts`) - `/` renders index page, add collapsible sidebar
  - Settings sidebar - add Tasks (Home) link at top
  - BLL Services - Update CategoryService, TaskDependencyService, RecurrenceService, RecurringTaskService to use DTOs
  - UiBridge - Update to work with new BLL DTOs
- **Services Used**: TaskService (fetch tasks), CategoryService (fetch/create categories), StatisticsService (get filtered stats), TaskDependencyService (fetch dependencies)
- **Dependencies**: Existing filter and sorting utilities in `src/utils/filter.ts` and `src/utils/sorting.ts`
