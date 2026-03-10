## ADDED Requirements

### Requirement: Task completionDate field
The system SHALL support a completionDate field on tasks to track when tasks were actually completed.

#### Scenario: New task has no completionDate
- **WHEN** a new task is created
- **THEN** the task's completionDate is undefined/null

#### Scenario: Completion date set when marking task done
- **WHEN** a task's status is changed to DONE via completeAsync or status update
- **THEN** the task's completionDate is automatically set to the current date/time

#### Scenario: Manual completion date override
- **WHEN** a user sets a completionDate explicitly when updating a task to DONE
- **THEN** the explicitly provided completionDate is used instead of the current date

#### Scenario: Backdated completion
- **WHEN** a user provides a completionDate in the past when marking a task as DONE
- **THEN** the task is marked done with the provided backdated completionDate

#### Scenario: Completion date cleared when unmarking done
- **WHEN** a task's status is changed from DONE to another status
- **THEN** the completionDate is cleared (set to undefined/null)

### Requirement: Completion date in DTOs
The system SHALL include completionDate in all task data transfer objects for create, update, and display operations.

#### Scenario: Create task with completionDate
- **WHEN** creating a new task with a completionDate value
- **THEN** the task is created with the provided completionDate

#### Scenario: Update task completionDate
- **WHEN** updating a task's completionDate
- **THEN** the task's completionDate is updated to the new value

#### Scenario: Display task with completionDate
- **WHEN** retrieving a task that has a completionDate
- **THEN** the completionDate is included in the displayed task data
