## ADDED Requirements

### Requirement: Junction Table Structure
The system SHALL maintain a junction table linking task instances to their recurring task source.

#### Scenario: Create junction entry
- **WHEN** a task is generated from a recurring task
- **THEN** a junction entry is created with: recurringTaskId, taskId, originalGeneratedDate
- **AND** lastRegeneratedDate is set to current time

#### Scenario: Query tasks by recurring source
- **WHEN** requesting all tasks from a specific recurring task
- **THEN** the junction table is queried to find all linked task IDs
- **AND** the corresponding tasks are returned

---

### Requirement: Metadata Tracking
The junction table SHALL track metadata about the relationship.

#### Scenario: Track original generation date
- **WHEN** a task is first generated
- **THEN** originalGeneratedDate is set to the calculated due date
- **AND** this date never changes even if task is regenerated

#### Scenario: Track regeneration
- **WHEN** a task is regenerated due to recurring task edit
- **THEN** lastRegeneratedDate is updated to current time
- **AND** originalGeneratedDate remains unchanged

---

### Requirement: Identify Future vs Past Tasks
The system SHALL use junction metadata to distinguish future tasks from completed ones.

#### Scenario: Identify future tasks
- **WHEN** a recurring task is modified
- **THEN** the system queries junction table for tasks where lastRegeneratedDate is recent
- **AND** tasks with dueDate > current time are considered "future"

#### Scenario: Preserve done task history
- **WHEN** a task linked to a recurring task is marked DONE
- **THEN** the junction entry is preserved
- **AND** the task is excluded from sync operations

---

### Requirement: Cascade Behavior
The system SHALL handle cascading operations through the junction table.

#### Scenario: Delete future tasks when stopped
- **WHEN** a recurring task is stopped
- **THEN** junction entries are used to find all linked tasks with status != DONE
- **AND** those tasks are deleted
- **AND** junction entries are removed

#### Scenario: Update task properties
- **WHEN** recurring task properties are edited (not interval)
- **THEN** junction table identifies all linked non-DONE tasks
- **AND** those tasks are updated with new properties
