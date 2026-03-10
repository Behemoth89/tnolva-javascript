# Plan: Build UI Settings Section

## Overview
Create a modern UI layer for the task management application with clear separation from business logic. First step focuses on the Settings section with CRUD operations for all repositories.

## Project Analysis

### Existing Architecture
- **Build System**: Vite + TypeScript (ES Modules)
- **Data Layer**: LocalStorage-based repositories with Unit of Work pattern
- **Business Layer**: BLL services (TaskService, CategoryService, etc.)
- **Domain Layer**: Entities and value objects

### Entities to Manage (from storageKeys.ts)
1. **Tasks** - `STORAGE_KEY_TASKS`
2. **Categories** - `STORAGE_KEY_CATEGORIES`
3. **Category Assignments** - `STORAGE_KEY_CATEGORY_ASSIGNMENTS`
4. **Recurrence Templates** - `STORAGE_KEY_RECURRENCE_TEMPLATES`
5. **Recurring Tasks** - `STORAGE_KEY_RECURRING_TASKS`
6. **Task Recurring Links** - `STORAGE_KEY_TASK_RECURRING_LINKS`
7. **Task Dependencies** - `STORAGE_KEY_TASK_DEPENDENCIES`

## UI Architecture

### Folder Structure
```
src/
├── ui/                          # UI layer (separate from business logic)
│   ├── index.html              # Main HTML entry (or modify root index.html)
│   ├── styles/
│   │   ├── main.css           # Main styles
│   │   ├── components.css     # Reusable components
│   │   └── settings.css       # Settings-specific styles
│   ├── scripts/
│   │   ├── app.ts             # Main application entry
│   │   ├── router.ts          # Simple page routing
│   │   ├── pages/
│   │   │   ├── settings.ts    # Settings page
│   │   │   ├── tasks-crud.ts  # Tasks CRUD page
│   │   │   ├── categories-crud.ts  # Categories CRUD page
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── navbar.ts      # Navigation component
│   │   │   ├── table.ts       # Data table component
│   │   │   ├── form.ts        # Form component
│   │   │   └── modal.ts       # Modal dialog component
│   │   └── services/
│   │       └── ui-bridge.ts   # Bridge between UI and BLL services
```

### Design Principles
1. **No frameworks** - Pure vanilla JavaScript/TypeScript
2. **Clear separation** - UI code isolated in `src/ui/` directory
3. **Easy removal** - Can delete entire `src/ui/` folder without affecting BLL
4. **Modern approach** - ES6+ features, CSS variables, responsive design

## Implementation Steps

### Step 1: Setup UI Structure
- Create `src/ui/` directory structure
- Create main stylesheet with CSS variables
- Set up basic HTML structure in settings page
- Create navigation component

### Step 2: Create Base UI Components
- Data table component for listing entities
- Form component for create/edit operations
- Modal component for confirmations
- Toast/notification system

### Step 3: Implement Tasks CRUD
- List all tasks with pagination
- Create new task form
- Edit existing task
- Delete task with confirmation

### Step 4: Implement Categories CRUD
- List all categories
- Create new category
- Edit category
- Delete category

### Step 5: Implement Recurrence Templates CRUD
- List templates
- Create/Edit/Delete operations
- Complex form with recurrence options

### Step 6: Implement Recurring Tasks CRUD
- List recurring tasks
- Manage recurring task settings
- Link to source templates

### Step 7: Implement Task Dependencies CRUD
- List dependencies
- Visual display of task relationships
- Create/Edit/Delete dependencies

### Step 8: Integration
- Wire up BLL services to UI
- Test all CRUD operations
- Ensure data persists to LocalStorage

## Next Steps (Future Phases)
- Main task board view with drag-and-drop
- Calendar view
- Statistics/dashboard view
- Enhanced filtering and search

## OpenSpec Artifacts to Create
1. `design.md` - UI architecture and design decisions
2. `proposal.md` - Summary of the change
3. `tasks.md` - Implementation task breakdown
4. `specs/ui-structure/` - UI folder structure specification
5. `specs/settings-page/` - Settings page specification
6. `specs/crud-components/` - Reusable CRUD components spec
7. `specs/task-crud/` - Task CRUD operations spec
8. `specs/category-crud/` - Category CRUD operations spec
9. `specs/recurrence-template-crud/` - Recurrence template CRUD spec
10. `specs/recurring-task-crud/` - Recurring task CRUD spec
11. `specs/dependency-crud/` - Task dependency CRUD spec
