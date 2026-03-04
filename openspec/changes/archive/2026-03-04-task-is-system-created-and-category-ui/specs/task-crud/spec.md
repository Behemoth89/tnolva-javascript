## MODIFIED Requirements

### Requirement: Task CRUD uses BLL DTOs
The task CRUD operations SHALL use BLL DTOs that include category information.

#### Scenario: Create task with category via BLL DTO
- **WHEN** a task is created with categoryId specified via BLL DTO
- **THEN** the task SHALL be created with the category assignment

#### Scenario: Create task without category via BLL DTO
- **WHEN** a task is created without categoryId via BLL DTO
- **THEN** the task SHALL be created without a category assignment

### Requirement: Task update operation handles category changes
The task update operation SHALL handle categoryId changes via BLL DTO.

#### Scenario: Update task category
- **WHEN** a task is updated with a different categoryId
- **THEN** the category assignment SHALL be updated

#### Scenario: Update task to remove category
- **WHEN** a task is updated to remove the category
- **THEN** the category assignment SHALL be deleted

### Requirement: Task list displays category information
The task list UI SHALL display category information for each task.

#### Scenario: Task list shows category name
- **WHEN** tasks are displayed in a list
- **THEN** each task SHALL show its category name (if assigned)

#### Scenario: Task list shows category color
- **WHEN** tasks are displayed in a list
- **THEN** each task MAY show a category color indicator
