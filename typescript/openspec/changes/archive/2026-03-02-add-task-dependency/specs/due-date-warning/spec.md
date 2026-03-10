## ADDED Requirements

### Requirement: Warn When Subtask Due Date Exceeds Main Task Due Date
The system SHALL warn users when a subtask's due date is later than its main task's due date:

- **WHEN** user sets or updates a subtask's due date
- **AND** the subtask has a main task (parent)
- **AND** the subtask's due date is after the main task's due date
- **THEN** system SHALL return a warning to the user
- **AND** prompt user to choose an action

#### Scenario: Warning when subtask due date exceeds main task
- **GIVEN** main task "Build House" has due date 2026-03-15
- **AND** subtask "Paint Walls" has due date 2026-03-20
- **WHEN** user sets or updates "Paint Walls" due date to 2026-03-20
- **THEN** system returns warning: "Subtask due date (2026-03-20) exceeds main task due date (2026-03-15)"

### Requirement: User Choice for Due Date Conflict Resolution
The system SHALL provide options for resolving due date conflicts:

- **WHEN** a due date warning is triggered
- **THEN** system SHALL offer two options:
  1. Change subtask due date to match main task due date
  2. Automatically extend main task due date to match subtask

#### Scenario: User chooses to change subtask due date
- **GIVEN** warning is shown for due date conflict
- **WHEN** user selects "Change subtask due date"
- **THEN** system changes subtask due date to match main task due date
- **AND** saves the updated subtask

#### Scenario: User chooses to auto-extend main task due date
- **GIVEN** warning is shown for due date conflict
- **WHEN** user selects "Extend main task due date"
- **THEN** system changes main task due date to match subtask due date
- **AND** saves both tasks

### Requirement: No Warning When Main Task Has No Due Date
The system SHALL NOT warn when the main task has no due date set:

- **WHEN** subtask's due date is set
- **AND** the main task has no due date (null)
- **THEN** system SHALL NOT show a warning

#### Scenario: No warning when main task has no due date
- **GIVEN** main task "Build House" has no due date
- **AND** subtask "Paint Walls" is being created with due date 2026-03-20
- **WHEN** user saves the subtask
- **THEN** system does not show due date warning

### Requirement: No Warning When Subtask Due Date Is On Or Before Main Task
The system SHALL NOT warn when subtask's due date is on or before main task's due date:

- **WHEN** subtask's due date is set or updated
- **AND** the subtask's due date is on or before the main task's due date
- **THEN** system SHALL NOT show any warning

#### Scenario: No warning when dates match
- **GIVEN** main task "Build House" has due date 2026-03-15
- **AND** subtask "Paint Walls" has due date 2026-03-15
- **WHEN** user sets or updates "Paint Walls" due date to 2026-03-15
- **THEN** system does not show due date warning

### Requirement: Check Due Date on Subtask Update
The system SHALL check due date conflicts when updating any subtask property:

- **WHEN** user updates a subtask (any field, not just due date)
- **AND** the subtask's due date exceeds main task's due date
- **THEN** system SHALL still show the warning

#### Scenario: Warning shown even when updating other fields
- **GIVEN** subtask already has due date exceeding main task
- **WHEN** user updates subtask title
- **THEN** system shows warning about due date conflict
