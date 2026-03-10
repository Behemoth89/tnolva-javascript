## ADDED Requirements

### Requirement: Generate New Task Instance on Completion
The system SHALL generate a new task instance when a recurring task is completed.

#### Scenario: Generate next occurrence from template
- **GIVEN** a task with `recurrenceTemplateId` pointing to a template with intervals `[{value: 1, unit: "days"}]` and `dueDate: 2026-02-28`
- **WHEN** the task is marked as completed
- **THEN** a new task SHALL be created with `dueDate: 2026-03-01`
- **AND** the new task SHALL have the same `title`, `description`, `priority`, and `recurrenceTemplateId` as the original

#### Scenario: Generate from compound template
- **GIVEN** a task with `recurrenceTemplateId` pointing to a template with intervals `[{value: 3, unit: "days"}]` and `dueDate: 2026-02-20`
- **WHEN** the task is completed
- **THEN** the new task SHALL have `dueDate: 2026-02-23`

### Requirement: Preserve Template Reference
The system SHALL keep the template reference on generated tasks.

#### Scenario: New instance keeps template reference
- **GIVEN** a task using a template
- **WHEN** a new instance is generated
- **THEN** the new task SHALL have the same `recurrenceTemplateId` as the original

#### Scenario: Original task remains after completion
- **GIVEN** a recurring task with status "DONE"
- **WHEN** a new instance is generated
- **THEN** the original task SHALL remain in the repository
- **AND** the original task status remains "DONE"

### Requirement: Generate Unique Task ID
The system SHALL generate unique identifiers for new task instances.

#### Scenario: New instance gets unique ID
- **GIVEN** a recurring task with ID "task-123"
- **WHEN** a new instance is generated
- **THEN** the new task SHALL have a different unique ID
- **AND** both tasks can coexist in the repository

### Requirement: Handle Task Without Template
The system SHALL NOT generate new instances for tasks without a template reference.

#### Scenario: Non-recurring task completion
- **GIVEN** a task without `recurrenceTemplateId`
- **WHEN** the task is marked as completed
- **THEN** no new task SHALL be generated

### Requirement: Generate from Updated Template
The system SHALL use the current template configuration when generating.

#### Scenario: Template modified after task creation
- **GIVEN** task A uses template T with intervals `[{value: 1, unit: "days"}]`
- **AND** template T is updated to intervals `[{value: 3, unit: "days"}]`
- **WHEN** task A is completed
- **THEN** the new task SHALL use the UPDATED intervals from template T (3 days)
- **AND** the new task's dueDate SHALL be 3 days from the original task's dueDate
