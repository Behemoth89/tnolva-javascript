## ADDED Requirements

### Requirement: List task dependencies
The user SHALL be able to view all task dependencies in a table format.

#### Scenario: Dependencies displayed in table
- **WHEN** the user navigates to the Task Dependencies CRUD page
- **THEN** all dependencies SHALL be displayed in a table
- **AND** each row SHALL show: task ID (with task title lookup), depends on task ID (with task title lookup), dependency type
- **AND** dependency type SHALL be: SUBTASK
- **AND** action buttons for edit and delete SHALL be available

### Requirement: Create task dependency
The user SHALL be able to create a new task dependency.

#### Scenario: Create dependency form
- **WHEN** the user clicks "Add Dependency" button
- **THEN** a form SHALL appear with fields for: task (dropdown of existing tasks), depends on task (dropdown of existing tasks), dependency type

#### Scenario: Save new dependency
- **WHEN** the user fills in required fields and clicks Save
- **AND** the selected tasks are valid (not the same, don't create circular dependency)
- **THEN** the dependency SHALL be created in storage
- **AND** the table SHALL update to show the new dependency

### Requirement: Edit task dependency
The user SHALL be able to edit an existing task dependency.

#### Scenario: Edit dependency form
- **WHEN** the user clicks Edit on a dependency row
- **THEN** a form SHALL appear pre-populated with the dependency's current values
- **AND** all fields SHALL be editable

#### Scenario: Save edited dependency
- **WHEN** the user modifies fields and clicks Save
- **AND** the selected tasks are valid
- **THEN** the dependency SHALL be updated in storage
- **AND** the table SHALL reflect the changes

### Requirement: Delete task dependency
The user SHALL be able to delete a task dependency.

#### Scenario: Delete dependency with confirmation
- **WHEN** the user clicks Delete on a dependency
- **THEN** a confirmation modal SHALL appear asking "Are you sure you want to delete this dependency?"
- **AND** confirming SHALL remove the dependency from storage
- **AND** the table SHALL update to remove the dependency
