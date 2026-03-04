## Why

Currently the task management application has no user-facing interface - all data manipulation happens through unit tests. Users need a browser-based UI, read to create, update, and delete tasks, categories, and other entities. The immediate goal is to build a Settings section where users can manage all repositories through CRUD operations.

## What Changes

- Create new `src/ui/` directory with clear separation from business logic
- Implement Settings page with navigation between entity types
- Build reusable CRUD UI components (tables, forms, modals)
- Implement full CRUD for Tasks entity
- Implement full CRUD for Categories entity
- Implement full CRUD for Recurrence Templates entity
- Implement full CRUD for Recurring Tasks entity
- Implement full CRUD for Task Dependencies entity
- Integrate UI with existing BLL services via TypeScript imports
- Use modern vanilla JavaScript/TypeScript (no frameworks)
- Style with modern CSS using CSS variables

## Capabilities

### New Capabilities
- `ui-structure`: Define the UI folder structure, file organization, and entry points
- `settings-page`: Settings page layout with sidebar navigation and content area
- `crud-components`: Reusable UI components (DataTable, Form, Modal, Toast)
- `task-crud`: Create, Read, Update, Delete operations for Tasks
- `category-crud`: Create, Read, Update, Delete operations for Categories
- `recurrence-template-crud`: Create, Read, Update, Delete operations for Recurrence Templates
- `recurring-task-crud`: Create, Read, Update, Delete operations for Recurring Tasks
- `dependency-crud`: Create, Read, Update, Delete operations for Task Dependencies
- `ui-bridge`: Service layer bridging UI components to BLL services

### Modified Capabilities
- None - this is a new UI layer on top of existing functionality

## Impact

- **New Code**: `src/ui/` directory with styles, scripts, and HTML files
- **Modified Files**: `index.html` to include UI entry point
- **No Breaking Changes**: Existing BLL services remain unchanged
- **Dependencies**: No new external dependencies - uses vanilla JS/TS with Vite
- **Removability**: Entire UI layer can be removed by deleting `src/ui/` directory
