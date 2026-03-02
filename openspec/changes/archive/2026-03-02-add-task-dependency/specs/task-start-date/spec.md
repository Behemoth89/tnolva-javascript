## ADDED Requirements

### Requirement: Task Has Start Date Field
The Task entity SHALL include a required startDate field:

- **id**: string (required) - unique identifier
- **title**: string (required) - task name
- **description**: string (optional) - task description
- **status**: enum (required) - current status
- **priority**: enum (required) - task priority
- **startDate**: timestamp (required) - when work on task begins (defaults to creation timestamp)
- **dueDate**: timestamp (optional) - when task is due
- **createdAt**: timestamp (required)
- **updatedAt**: timestamp (required)

#### Scenario: Create task without start date
- **WHEN** user creates a task without specifying startDate
- **THEN** startDate defaults to current timestamp (task creation time)
- **AND** task is created successfully

#### Scenario: Create task with custom start date
- **WHEN** user creates a task with startDate=2026-03-16 and dueDate=2026-03-20
- **THEN** task is created with the specified startDate

### Requirement: Start Date Must Be Before or Equal To Due Date
The system SHALL validate that startDate is not after dueDate:

- **WHEN** user creates or updates a task with startDate > dueDate
- **THEN** system SHALL reject with validation error

#### Scenario: Reject task where start date is after due date
- **WHEN** user tries to set startDate=2026-03-25, dueDate=2026-03-20
- **THEN** system throws error: "Start date cannot be after due date"

### Requirement: Recurring Tasks Generate Start Date and Duration
When a recurring task instance is generated, it SHALL include startDate and calculate dueDate from duration:

- **WHEN** recurring task template specifies recurrence by start date with duration
- **AND** the recurrence triggers
- **THEN** generated task includes:
  - startDate = the recurrence date
  - dueDate = startDate + duration

#### Scenario: Monthly recurring task with duration
- **GIVEN** recurring template: "Monthly Report", recurs on 1st of each month, duration=5 days
- **WHEN** generator creates instance for March 2026
- **THEN** instance has startDate=2026-03-01, dueDate=2026-03-05

#### Scenario: Weekly recurring task with duration
- **GIVEN** recurring template: "Weekly Sprint", recurs every Monday, duration=5 days
- **WHEN** generator creates instance for week of March 16
- **THEN** instance has startDate=2026-03-16 (Monday), dueDate=2026-03-20 (Friday)
