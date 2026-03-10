## ADDED Requirements

### Requirement: List recurring tasks
The user SHALL be able to view all recurring tasks in a table format.

#### Scenario: Recurring tasks displayed in table
- **WHEN** the user navigates to the Recurring Tasks CRUD page
- **THEN** all recurring tasks SHALL be displayed in a table
- **AND** each row SHALL show: title, priority, start date, end date, status
- **AND** status options SHALL be: ACTIVE, STOPPED
- **AND** action buttons for edit and delete SHALL be available

### Requirement: Create recurring task
The user SHALL be able to create a new recurring task.

#### Scenario: Create recurring task form
- **WHEN** the user clicks "Add Recurring Task" button
- **THEN** a form SHALL appear with fields for: title, description, priority, start date, end date, intervals, tags, category IDs, status

#### Scenario: Save new recurring task
- **WHEN** the user fills in required fields and clicks Save
- **THEN** the recurring task SHALL be created in storage
- **AND** the table SHALL update to show the new recurring task

### Requirement: Edit recurring task
The user SHALL be able to edit an existing recurring task.

#### Scenario: Edit recurring task form
- **WHEN** the user clicks Edit on a recurring task row
- **THEN** a form SHALL appear pre-populated with the recurring task's current values
- **AND** all fields SHALL be editable

#### Scenario: Save edited recurring task
- **WHEN** the user modifies fields and clicks Save
- **THEN** the recurring task SHALL be updated in storage
- **AND** the table SHALL reflect the changes

### Requirement: Delete recurring task
The user SHALL be able to delete a recurring task.

#### Scenario: Delete recurring task with confirmation
- **WHEN** the user clicks Delete on a recurring task
- **THEN** a confirmation modal SHALL appear asking "Are you sure you want to delete this recurring task?"
- **AND** confirming SHALL remove the recurring task from storage
- **AND** the table SHALL update to remove the recurring task
