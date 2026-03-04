## ADDED Requirements

### Requirement: Category field in task create DTO
The task create DTO SHALL support an optional `categoryId` field for category assignment.

#### Scenario: Create task with category
- **WHEN** a user creates a task and selects a category
- **THEN** the DTO SHALL include the selected `categoryId`
- **AND** the TaskService SHALL create an `ITaskCategoryAssignmentEntity` junction record

#### Scenario: Create task without category
- **WHEN** a user creates a task without selecting a category
- **THEN** the DTO SHALL NOT include a `categoryId` (or it SHALL be undefined)
- **AND** no category assignment SHALL be created

### Requirement: Category field in task update DTO
The task update DTO SHALL support an optional `categoryId` field for changing category assignment.

#### Scenario: Update task category
- **WHEN** a user updates a task and selects a different category
- **THEN** the existing category assignment SHALL be replaced with the new one

#### Scenario: Clear task category
- **WHEN** a user updates a task and removes the category selection
- **THEN** the existing category assignment SHALL be deleted

#### Scenario: Update task without changing category
- **WHEN** a user updates a task but does not touch the category field
- **THEN** the existing category assignment SHALL remain unchanged

### Requirement: Category displayed in task form
The task create/update form SHALL display a category dropdown.

#### Scenario: Category dropdown shows all categories
- **WHEN** the task form is opened
- **THEN** the category dropdown SHALL display all available categories
- **AND** there SHALL be a "No category" option as default

#### Scenario: Selected category displayed on edit
- **WHEN** editing an existing task that has a category
- **THEN** the category dropdown SHALL show the current category as selected
