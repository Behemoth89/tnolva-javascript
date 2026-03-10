## ADDED Requirements

### Requirement: Task has system-created flag
The Task entity SHALL have a boolean flag `isSystemCreated` to indicate whether the task was created by the system (e.g., recurring task generator) or manually by the user.

#### Scenario: Default value for manually created tasks
- **WHEN** a user creates a task without specifying system-created status
- **THEN** the task's `isSystemCreated` field SHALL be `false`

#### Scenario: System-created tasks have flag set
- **WHEN** a system process creates a task (e.g., recurring task generator)
- **THEN** the task's `isSystemCreated` field SHALL be `true`

#### Scenario: Query tasks by system-created status
- **WHEN** a caller queries tasks with a filter for system-created status
- **THEN** the repository SHALL return only tasks matching the specified `isSystemCreated` value

### Requirement: Recurrence template reference removed from task
The Task entity SHALL NOT store a direct reference to a recurrence template.

#### Scenario: Task created from recurring template
- **WHEN** a task is generated from a recurring template
- **THEN** the task SHALL have `isSystemCreated` set to `true`
- **AND** the task-recurring relationship SHALL be tracked via the existing `ITaskRecurringLinkEntity` junction table

#### Scenario: Existing recurrenceTemplateId field access
- **WHEN** code attempts to read `recurrenceTemplateId` from a task entity
- **THEN** the field SHALL NOT exist on the entity interface
