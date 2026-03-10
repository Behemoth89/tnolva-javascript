## ADDED Requirements

### Requirement: Recurring Task Has Duration Parameter
The recurring task template SHALL include a duration parameter:

- **duration**: number (required) - task length in days
- Recurrence is based on start date
- Due date is calculated as: startDate + duration

#### Scenario: Monthly task with duration
- **GIVEN** recurring template: "Monthly Report", recurs on 1st of month, duration=5 days
- **WHEN** generator creates instance for March 2026
- **THEN** startDate=2026-03-01, dueDate=2026-03-05

### Requirement: Duration Is Required for Recurring Tasks
A recurring task template SHALL require a duration parameter:

- **WHEN** user creates a recurring task template
- **AND** duration is not specified
- **THEN** system SHALL require duration to be set

#### Scenario: Recurring task without duration is rejected
- **WHEN** user tries to create recurring template without duration
- **THEN** system throws error: "Duration is required for recurring tasks"

### Requirement: Recurrence Based on Start Date
Recurring tasks SHALL generate new instances based on start date:

- **WHEN** calculating next occurrence
- **THEN** use start date as the anchor point
- **AND** each new instance starts at the recurrence date
- **AND** due date = startDate + duration

#### Scenario: Weekly recurrence by start date
- **GIVEN** recurring template: "Weekly Sprint", recurs every Monday, duration=5 days
- **WHEN** last instance was 2026-03-09 (Monday) to 2026-03-13 (Friday)
- **AND** next recurrence is 2026-03-16 (Monday)
- **THEN** new instance: startDate=2026-03-16, dueDate=2026-03-20

### Requirement: Duration Used for Subtask Template Calculations
When generating subtasks, duration is used to calculate dates:

- **WHEN** subtask template has duration
- **THEN** subtask.dueDate = subtask.startDate + duration

#### Scenario: Subtask with duration
- **GIVEN** parent: startDate=2026-03-01, dueDate=2026-03-05 (duration=4)
- **AND** subtask template: "Review", startDateOffset=3, duration=1
- **WHEN** parent is generated
- **THEN** subtask.startDate = 2026-03-01 + 3 = 2026-03-04
- **AND** subtask.dueDate = 2026-03-04 + 1 = 2026-03-05
