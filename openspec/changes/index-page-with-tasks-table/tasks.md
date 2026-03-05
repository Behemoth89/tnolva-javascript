## 1. BLL DTO Pattern Implementation

- [x] 1.1 Create IBllCategoryDto interface (id, name, color, taskCount)
- [x] 1.2 Create IBllCategoryCreateDto interface
- [x] 1.3 Update CategoryService to return IBllCategoryDto
- [x] 1.4 Create IBllDependencyDto for task dependencies
- [x] 1.5 Update TaskDependencyService to return IBllTaskDto for getSubtasksAsync and getParentTaskAsync
- [x] 1.6 Create BLL DTOs for RecurrenceService
- [x] 1.7 Update RecurrenceService to return BLL DTOs
- [x] 1.8 Create BLL DTOs for RecurringTaskService
- [x] 1.9 Update RecurringTaskService to return BLL DTOs

## 2. UiBridge DTO Updates

- [x] 2.1 Update UiBridge.getAllCategories() to return IBllCategoryDto[]
- [x] 2.2 Update UiBridge.createCategory() to return IBllCategoryDto
- [x] 2.3 Update UiBridge.getSubtasks() to return IBllTaskDto[]
- [x] 2.4 Update UiBridge.getParentTask() to return IBllTaskDto
- [x] 2.5 Update other UiBridge methods to return appropriate DTOs

## 3. Collapsible Sidebar Component

- [x] 3.1 Create collapsible sidebar component with toggle button
- [x] 3.2 Implement sidebar collapse/expand functionality
- [x] 3.3 Add navigation links: Tasks (Home), Categories, Templates, Recurring Tasks, Dependencies
- [x] 3.4 Persist sidebar state in localStorage
- [x] 3.5 Integrate sidebar into router layout

## 4. Index Page - Task Table

- [x] 4.1 Create index page component (src/ui/pages/index.ts)
- [x] 4.2 Configure router to render index at route `/`
- [x] 4.3 Implement table with columns: status, title, category, description, tags, start date, due date, actions
- [x] 4.4 Integrate TableSorter for column sorting
- [x] 4.5 Add filter inputs for each column
- [x] 4.6 Implement FilterController for filter management
- [x] 4.7 Add empty state when no tasks

## 5. Index Page - Date Range Filter

- [x] 5.1 Add start date and end date inputs to filter section
- [x] 5.2 Add preset dropdown (Today, This week, Next week, This month, Next month, This year, Clear)
- [x] 5.3 Implement preset date calculations
- [x] 5.4 Implement date range filtering logic (inclusive on both dates)
- [x] 5.5 Connect date filter to FilterController

## 6. Index Page - Statistics Panel

- [x] 6.1 Add statistics panel above or below table
- [x] 6.2 Display filtered task count
- [x] 6.3 Display high priority task count (EPriority.HIGH)
- [x] 6.4 Update statistics when filters change

## 7. Index Page - Add Task Modal

- [x] 7.1 Create task add/edit modal component
- [x] 7.2 Add form fields: title, description, status, priority, category, tags, start date, due date, dependencies
- [x] 7.3 Implement searchable category dropdown using createSearchableDropdown
- [x] 7.4 Implement searchable dependency dropdown (show only TODO/IN_PROGRESS tasks)
- [x] 7.5 Add form validation (title required)
- [x] 7.6 Connect form to TaskService via UiBridge

## 8. Index Page - Inline Category Creation

- [x] 8.1 Add "Add New Category" button next to category dropdown
- [x] 8.2 Create quick category creation dialog
- [x] 8.3 Implement category creation via CategoryService
- [x] 8.4 Auto-select newly created category in dropdown after creation
- [x] 8.5 Handle cancel action gracefully

## 9. Index Page - Task Actions

- [x] 9.1 Add Edit button in actions column
- [x] 9.2 Implement edit modal (pre-filled with task data)
- [x] 9.3 Add Delete button in actions column
- [x] 9.4 Implement delete confirmation dialog
- [x] 9.5 Connect edit/delete to TaskService via UiBridge
- [x] 9.6 Handle circular dependency validation on save

## 10. Testing & Integration

- [x] 10.1 Test sorting on all columns
- [x] 10.2 Test filtering on all columns
- [x] 10.3 Test date range filter with all presets
- [x] 10.4 Test statistics panel updates
- [x] 10.5 Test add task flow
- [x] 10.6 Test edit task flow
- [x] 10.7 Test delete task flow
- [x] 10.8 Test inline category creation
- [x] 10.9 Test sidebar collapse/expand
- [x] 10.10 Verify all existing functionality still works
