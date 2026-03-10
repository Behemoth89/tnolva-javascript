## ADDED Requirements

### Requirement: Generate Task Instances
The system SHALL generate task instances from a recurring task based on its interval configuration.

#### Scenario: Generate instances up to 1 year ahead
- **WHEN** a recurring task is created with startDate = today
- **THEN** task instances are generated for all dates from startDate up to 1 year ahead
- **AND** each instance has a unique ID
- **AND** each instance has status = TODO

#### Scenario: Generate single instance for long interval
- **WHEN** a recurring task has an interval of 18 months
- **THEN** only ONE task instance is generated (the next occurrence)
- **AND** subsequent instances are generated as time progresses

#### Scenario: Interval calculation
- **WHEN** generating instances for interval "every 3 days"
- **THEN** instances are created on startDate, startDate+3days, startDate+6days, etc.

---

### Requirement: Generated Task Properties
Generated task instances SHALL inherit properties from the recurring task.

#### Scenario: Inherit basic properties
- **WHEN** task instance is generated
- **THEN** it inherits: title, description, priority, tags from the recurring task

#### Scenario: Set due date
- **WHEN** task instance is generated
- **THEN** dueDate is set to the calculated occurrence date
- **AND** createdAt is set to current time

#### Scenario: Inherit categories
- **WHEN** task instance is generated
- **THEN** categoryIds are copied from the recurring task

---

### Requirement: Generation on Create/Edit
The system SHALL generate task instances when a recurring task is created or edited.

#### Scenario: Generate on creation
- **WHEN** a new recurring task is created
- **THEN** task instances are generated immediately

#### Scenario: Generate on edit (no interval change)
- **WHEN** a recurring task is edited but interval stays the same
- **THEN** existing future task instances are updated with new task properties
- **AND** new instances are generated if needed to fill the 1-year window

#### Scenario: Generate on interval change
- **WHEN** a recurring task is edited and interval changes
- **THEN** all future task instances are deleted and regenerated with new interval

---

### Requirement: Generation Boundaries
The system SHALL respect date range boundaries when generating tasks.

#### Scenario: Respect end date
- **WHEN** recurring task has endDate = 6 months from now
- **THEN** no task instances are generated beyond the endDate

#### Scenario: Extend generation for indefinite
- **WHEN** recurring task is indefinite and existing instances are less than 1 year ahead
- **THEN** additional instances are generated to maintain 1-year window

---

### Requirement: Junction Table Link
Each generated task SHALL be linked to its recurring task via the junction table.

#### Scenario: Create link on generation
- **WHEN** a task instance is generated
- **THEN** a junction table entry is created with recurringTaskId, taskId, and originalGeneratedDate
