## ADDED Requirements

### Requirement: Edit Task Button
The system SHALL display an Edit button in the actions column for each task row.

#### Scenario: Edit button visible
- **WHEN** task table renders
- **THEN** system displays an Edit button in the actions column for each row

#### Scenario: Click edit opens pre-filled modal
- **WHEN** user clicks Edit button on a task row
- **THEN** system opens the task add modal pre-filled with that task's data
- **AND** modal is in edit mode (shows "Update" instead of "Create")

### Requirement: Delete Task Button
The system SHALL display a Delete button in the actions column for each task row.

#### Scenario: Delete button visible
- **WHEN** task table renders
- **THEN** system displays a Delete button in the actions column for each row

#### Scenario: Click delete shows confirmation
- **WHEN** user clicks Delete button
- **THEN** system shows confirmation dialog "Delete this task?"

#### Scenario: Confirm delete removes task
- **WHEN** user confirms deletion
- **THEN** system deletes task via TaskService
- **AND** removes row from table
- **AND** shows success toast

#### Scenario: Cancel delete does nothing
- **WHEN** user cancels deletion
- **THEN** system closes confirmation dialog without deleting

### Requirement: Update Task
The system SHALL allow updating an existing task through the edit modal.

#### Scenario: Submit updates task
- **WHEN** user modifies task data and submits
- **THEN** system updates task via TaskService
- **AND** closes modal
- **AND** refreshes task table with updated data
