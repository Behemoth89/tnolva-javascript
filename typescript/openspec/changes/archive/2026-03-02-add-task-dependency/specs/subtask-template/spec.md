## ADDED Requirements

### Requirement: Subtask Template Structure
Each subtask template SHALL contain:

- **title**: string (required) - name of the subtask
- **description**: string (optional) - description of the subtask
- **priority**: enum (optional, defaults to parent's priority)
- **startDateOffset**: number (required) - days relative to parent start date
- **duration**: number (optional) - if set, dueDate = startDate + duration days

#### Scenario: Subtask template with startDateOffset and duration
- **GIVEN** subtask template with title="Review", description="Code review", priority=HIGH, startDateOffset=2, duration=1
- **AND** parent task has startDate=2026-03-16 (Monday)
- **THEN** generated subtask will have:
  - title="Review"
  - priority=HIGH
  - startDate=2026-03-18 (2026-03-16 + 2)
  - dueDate=2026-03-19 (2026-03-18 + 1)

### Requirement: Subtask Start Date Cannot Exceed Parent Due Date
Generated subtasks SHALL have dates that do not exceed the parent task's due date:

- **WHEN** subtask dates are calculated from startDateOffset and duration
- **THEN** the resulting dueDate MUST be ≤ parent task's dueDate
- **IF** calculated dueDate > parent dueDate, adjust duration accordingly

#### Scenario: Adjust duration to fit parent due date
- **GIVEN** parent task: startDate=2026-03-16, dueDate=2026-03-20
- **AND** subtask template: startDateOffset=3, duration=5
- **WHEN** calculated: startDate=2026-03-19, dueDate=2026-03-24
- **THEN** dueDate exceeds parent (2026-03-24 > 2026-03-20)
- **AND** system adjusts: dueDate=2026-03-20 (or reduces duration)

### Requirement: Generate Subtasks When Parent Recurs
When a recurring task instance is generated, the system SHALL automatically create all subtasks:

- **WHEN** recurring task generator creates a new instance of the main task
- **AND** the template has subtask templates defined
- **THEN** system SHALL create one subtask for each subtask template
- **AND** set each subtask's due date = main task due date + offset
- **AND** create TaskDependency linking each subtask to the main task

#### Scenario: Generate recurring task with subtasks
- **GIVEN** recurring template "Sprint" with main task due every Friday
- **AND** subtask template "Plan" with dueDateOffset=-3
- **WHEN** generator creates a new Sprint instance with due date 2026-03-20 (Friday)
- **THEN** system creates main task with due date 2026-03-20
- **AND** creates subtask "Plan" with due date 2026-03-17 (2026-03-20 + -3)
- **AND** creates TaskDependency linking subtask to main task

### Requirement: Bypass Due Date Warning for Generated Subtasks
Generated subtasks SHALL NOT trigger due date warnings:

- **WHEN** subtask is generated from a template (not user-created)
- **AND** the subtask's due date exceeds the parent's due date (due to offset)
- **THEN** system SHALL NOT show a due date warning
- **AND** the offset is assumed to be intentional

#### Scenario: Generated subtask with positive offset
- **GIVEN** subtask template "Review" with offset=+1 (day after parent)
- **WHEN** parent has due date Friday, subtask generated with due date Saturday
- **THEN** system does NOT show due date warning (template-generated, not user-set)

### Requirement: Delete Subtasks When Parent Task Is Deleted
When a recurring task instance is deleted, its generated subtasks SHALL also be deleted:

- **WHEN** user deletes a main task that was generated from a recurring template
- **AND** the main task has subtasks
- **THEN** system SHALL delete all subtasks
- **AND** delete all TaskDependency records

#### Scenario: Delete parent with generated subtasks
- **GIVEN** main task "Sprint 1" with 3 generated subtasks
- **WHEN** user deletes "Sprint 1"
- **THEN** all 3 subtasks are deleted
- **AND** all dependency records are deleted
