## Context

**Current State:**
- Application loads at `/` → redirects to `/settings` → redirects to `/settings/tasks`
- Current settings layout has sidebar with navigation
- Existing utilities: `TableSorter`, `FilterController`, `createSearchableDropdown` in `src/utils/`
- UiBridge provides access to TaskService, CategoryService, StatisticsService, TaskDependencyService
- Task entity has: id, title, description, status, priority, categoryId, categoryName, categoryColor, tags, startDate, dueDate, isSystemCreated, createdAt, updatedAt
- StatisticsService has `getTaskPriorityStatistics()` which returns counts by priority

**Constraints:**
- Must use existing filter and sorting utilities
- Interface naming must use `I` prefix (e.g., `ITaskIndexView`)
- Enums must use `E` prefix (e.g., `EIndexSortField`)
- Cannot modify existing BLL services (their interfaces are complete)

## Goals / Non-Goals

**Goals:**
1. Create a dedicated index page (`/`) that displays tasks in a sortable/filterable table (as default route)
2. Implement collapsible sidebar visible on all pages with toggle button
3. Add "Tasks" (Home) link to sidebar navigation pointing to index page
4. Implement column sorting using existing `TableSorter` utility
5. Implement column filtering using existing `FilterController` utility
6. Add date range filter (start date and end date, inclusive on both) with helper dropdown for quick presets
7. Display statistics: total filtered task count, high priority filtered count
8. Add task modal with searchable dropdowns for category and dependencies
9. Allow inline category creation from task add modal
10. Task editing and deletion directly from index table (inline edit/delete buttons)
11. Expand BLL DTO pattern to CategoryService, TaskDependencyService, RecurrenceService, RecurringTaskService
12. Update UiBridge to use BLL DTOs for all services

**Non-Goals:**
- Recurring task management on index page
- Complex dependency visualization
- Export functionality

## Decisions

### D1: Index Page Layout
**Decision:** Create a standalone index page with its own layout that includes a collapsible sidebar

**Rationale:** 
- The index page is the main entry point
- Sidebar should be visible on all pages (index, settings, etc.)
- Collapsible to give more screen space when needed
- Sidebar contains: Tasks (Home), Categories, Templates, Recurring Tasks, Dependencies

**Alternative Considered:** Standalone index without sidebar - rejected because navigation is needed.

### D2: Default Route
**Decision:** `/` (root) renders the index page with tasks table

**Rationale:**
- Users expect to see tasks when opening the app
- Better user experience than redirecting to settings
- Sidebar provides access to other pages

**Alternative:** Keep existing redirect flow - rejected per user requirements.

### D2: Statistics Approach
**Decision:** Calculate statistics client-side from the fetched task list

**Rationale:** 
- StatisticsService provides `getTaskPriorityStatistics()` which returns counts per priority
- For filtered results, we can filter the in-memory task array and recalculate stats
- No need to modify BLL services for this

**Alternative Considered:** Add filtered statistics method to StatisticsService - rejected to avoid BLL changes.

### D3: Date Range Filter Implementation
**Decision:** Filter by startDate (inclusive) when start date provided, filter by dueDate (inclusive) when end date provided, combine with AND logic. Add helper dropdown for quick presets.

**Rationale:** 
- Tasks have both startDate (required) and dueDate (optional)
- When both dates are set, show tasks where: startDate >= filterStart AND dueDate <= filterEnd
- When only start date: tasks where startDate >= filterStart
- When only end date: tasks where dueDate <= filterEnd (or startDate if no dueDate)
- Quick presets: Today, This week, Next week, This month, Next month, This year

**Quick Presets Implementation:**
- "Today": start = today 00:00, end = today 23:59
- "This week": start = Monday of current week, end = Sunday of current week
- "Next week": start = Monday of next week, end = Sunday of next week
- "This month": start = 1st of current month, end = last day of current month
- "Next month": start = 1st of next month, end = last day of next month
- "This year": start = Jan 1st, end = Dec 31st
- Preset sets both start and end date fields
- "Clear" option to reset both date fields

**Alternative:** Filter by any date field - rejected because it doesn't match user's "between start and end" requirement.

### D4: Task Dependencies Dropdown
**Decision:** Use TaskDependencyService to fetch all tasks, display as searchable dropdown

**Rationale:**
- TaskDependencyService has `getSubtasksAsync()` and `getParentTaskAsync()` but not "get all potential dependencies"
- Can fetch all tasks via TaskService and display in dropdown
- Show task title (and ID if needed) in dropdown options

**Alternative:** Create new method in TaskDependencyService - rejected to avoid BLL changes.

### D5: Category Dropdown with Inline Create
**Decision:** Use existing `createSearchableDropdown` for category selection, add "Add New Category" button that opens a mini-modal

**Rationale:**
- `createSearchableDropdown` already provides searchable dropdown functionality
- Add button next to dropdown triggers category creation modal
- Category creation uses existing CategoryService via UiBridge

**Alternative:** Create custom dropdown with inline input - rejected to reuse existing utility.

### D6: Table Column Sorting
**Decision:** Use existing `TableSorter<IBllTaskDto>` class

**Rationale:** The utility already handles:
- Toggle between ASC/DESC
- Multiple data types (string, number, Date)
- Null/undefined handling

The table will render with sort handlers that call `taskSorter.sort(field)`.

### D7: Table Column Filtering  
**Decision:** Use existing `FilterController` for filter management

**Rationale:**
- FilterController provides register/apply/clear functionality
- Each column filter will be registered with a filter function
- Date range filter will also use FilterController

### D8: Task Actions on Index Page
**Decision:** Add Edit and Delete buttons in the actions column of each row

**Rationale:**
- Edit button opens edit modal (same as add modal but pre-filled)
- Delete button shows confirmation, then calls TaskService.deleteAsync()
- This replaces the need to navigate to settings for basic operations
- More complex operations (recurring tasks, dependencies) can still use settings pages

**Alternative:** Navigate to full task CRUD page - rejected because most tasks just need viewing, adding, editing, deleting.

### D9: Remove Settings Tasks Page
**Decision:** After index page is working, delete tasks-crud.ts and remove from router and sidebar

**Rationale:**
- Index page now handles all basic task operations (add, edit, delete)
- Settings sidebar will only show: Categories, Templates, Recurring Tasks, Dependencies
- Simpler navigation, no duplicate functionality

**Alternative:** Keep both pages - rejected to avoid confusion and duplicate code.

### D10: Expand BLL DTO Pattern
**Decision:** Add BLL DTOs to all services following the same pattern as TaskService

**Rationale:**
- Currently TaskService uses IBllTaskDto, IBllTaskCreateDto, IBllTaskUpdateDto
- Other services return raw entities which mixes concerns
- Create similar DTOs for:  
  - CategoryService → IBllCategoryDto, IBllCategoryCreateDto
  - TaskDependencyService → IBllDependencyDto (for subtask/parent info)
  - RecurrenceService → IBllRecurrenceDto
  - RecurringTaskService → IBllRecurringTaskDto

**Implementation:**
1. Create DTO interfaces in `src/bll/interfaces/dtos/`
2. Update service implementations to map entities to DTOs
3. Update UiBridge to work with DTOs instead of entities
4. This ensures consistent data flow from BLL to UI

**Alternative:** Keep using entities - rejected for inconsistency with TaskService pattern.

## Risks / Trade-offs

### R1: Performance with Large Task Lists
**Risk:** Client-side filtering/sorting may be slow with thousands of tasks

**Mitigation:** 
- Add pagination if needed in future
- Statistics can be pre-calculated server-side later
- Current app scale likely won't hit this limit

### R2: Dependency Dropdown Shows All Tasks
**Risk:** When adding a task, showing ALL tasks as potential dependencies may be overwhelming

**Mitigation:**
- Filter dropdown to show only TODO/IN_PROGRESS tasks (cannot block on completed tasks)
- Show task title truncated with ellipsis
- Could add category filter in future

### R3: Date Range with No Due Date
**Risk:** Tasks without dueDate won't appear in end-date filtered results

**Mitigation:** 
- Document this behavior
- Consider using startDate for tasks without dueDate
- Allow "no due date" filter option in future

### R4: Circular Dependency
**Risk:** User might create circular task dependencies

**Mitigation:**
- TaskDependencyService already validates against circular references
- The service throws error on creation - UI should catch and show error message
- Show validation message if user tries to add dependent on a task that would create cycle

### R5: Removing Settings Tasks Page
**Risk:** Users who bookmarked /settings/tasks will get broken link

**Mitigation:**
- Redirect /settings/tasks to index page
- Show toast message explaining tasks are now on home page

### R6: BLL DTO Expansion
**Risk:** Adding DTOs to multiple services is a large change that could break existing functionality

**Mitigation:**
- Add DTOs incrementally, one service at a time
- Keep entities as internal implementation detail
- Update UiBridge after all DTOs are in place
- Test each service individually
