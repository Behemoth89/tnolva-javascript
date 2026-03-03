## ADDED Requirements

### Requirement: List tasks
The user SHALL be able to view all tasks in a table format.

#### Scenario: Tasks displayed in table
- **WHEN** the user navigates to the Tasks CRUD page
- **THEN** all tasks SHALL be displayed in a table
- **AND** each row SHALL show: title, status, priority, start date, due date
- **AND** action buttons for edit and delete SHALL be available

### Requirement: Create task
The user SHALL be able to create a new task.

#### Scenario: Create task form
- **WHEN** the user clicks "Add Task" button
- **THEN** a form SHALL appear with fields for: title, description, status, priority, start date, due date, tags
- **AND** status options SHALL be: TODO, IN_PROGRESS, DONE, CANCELLED
- **AND** priority options SHALL be: LOW, MEDIUM, HIGH, URGENT

#### Scenario: Save new task
- **WHEN** the user fills in required fields and clicks Save
- **THEN** the task SHALL be created in storage
- **AND** the table SHALL update to show the new task

### Requirement: Edit task
The user SHALL be able to edit an existing task.

#### Scenario: Edit task form
- **WHEN** the user clicks Edit on a task row
- **THEN** a form SHALL appear pre-populated with the task's current values
- **AND** all fields SHALL be editable

#### Scenario: Save edited task
- **WHEN** the user modifies fields and clicks Save
- **THEN** the task SHALL be updated in storage
- **AND** the table SHALL reflect the changes

### Requirement: Delete task
The user SHALL be able to delete a task.

#### Scenario: Delete task with confirmation
- **WHEN** the user clicks Delete on a task
- **THEN** a confirmation modal SHALL appear asking "Are you sure you want to delete this task?"
- **AND** confirming SHALL remove the task from storage
- **AND** the table SHALL update to remove the task
