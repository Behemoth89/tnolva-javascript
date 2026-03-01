## ADDED Requirements

### Requirement: Create Recurring Task
The system SHALL provide functionality to create a new recurring task.

#### Scenario: Create with all fields
- **WHEN** user provides title, description, priority, startDate, endDate (optional), intervals
- **THEN** a new recurring task is created with status ACTIVE
- **AND** task instances are generated based on configuration

#### Scenario: Create with default values
- **WHEN** user provides only required fields (title, priority, startDate, intervals)
- **THEN** recurring task is created with default values
- **AND** description = empty, tags = [], categoryIds = []

---

### Requirement: Edit Recurring Task
The system SHALL provide functionality to edit an existing recurring task.

#### Scenario: Edit basic properties
- **WHEN** user edits title, description, priority of a recurring task
- **THEN** the recurring task is updated
- **AND** sync logic updates linked future tasks

#### Scenario: Edit interval
- **WHEN** user edits intervals of a recurring task
- **THEN** the recurring task is updated
- **AND** sync logic regenerates linked future tasks

#### Scenario: Edit date range
- **WHEN** user edits startDate or endDate
- **THEN** the recurring task is updated
- **AND** task instances are adjusted accordingly

---

### Requirement: Stop Recurring Task
The system SHALL allow stopping an active recurring task.

#### Scenario: Stop via status change
- **WHEN** user changes recurring task status to STOPPED
- **THEN** the recurring task status is updated
- **AND** future linked tasks are deleted

#### Scenario: Stop preserves history
- **WHEN** a recurring task is stopped
- **THEN** completed linked tasks remain in storage
- **AND** can be viewed in task history

---

### Requirement: View All Recurring Tasks
The system SHALL provide a way to view all recurring tasks.

#### Scenario: List all recurring tasks
- **WHEN** requesting all recurring tasks
- **THEN** returns all recurring tasks regardless of status

#### Scenario: Filter by status
- **WHEN** requesting recurring tasks filtered by status (ACTIVE, STOPPED)
- **THEN** only matching recurring tasks are returned

---

### Requirement: Get Recurring Task Details
The system SHALL provide functionality to get details of a specific recurring task.

#### Scenario: Get by ID
- **WHEN** requesting recurring task by ID
- **THEN** returns the recurring task if found
- **OR** returns null if not found

#### Scenario: Get linked tasks
- **WHEN** requesting all tasks generated from a recurring task
- **THEN** returns all linked tasks via junction table
- **AND** includes both DONE and non-DONE tasks
