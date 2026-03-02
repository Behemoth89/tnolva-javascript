## ADDED Requirements

### Requirement: Batch Generation Utility
The system SHALL provide a utility function to generate pending tasks for all active recurring tasks.

#### Scenario: Run batch generation
- **WHEN** batch generation utility is invoked
- **THEN** all recurring tasks with status ACTIVE are processed
- **AND** new task instances are generated to maintain 1-year window

#### Scenario: Skip stopped tasks
- **WHEN** batch generation runs
- **THEN** recurring tasks with status STOPPED are ignored

#### Scenario: Skip tasks with no due date needed
- **WHEN** recurring task already has instances up to 1 year ahead
- **THEN** no new instances are generated for that recurring task

---

### Requirement: Admin Panel Integration
The batch generation utility SHALL be callable from an external source.

#### Scenario: Programmatic call
- **WHEN** generateAllPendingTasks() is called
- **THEN** the function returns count of tasks generated
- **AND** errors are logged but don't stop processing of other recurring tasks

#### Scenario: Scheduled execution
- **WHEN** batch generation is scheduled (e.g., monthly via cron)
- **THEN** it runs without user intervention
- **AND** maintains the 1-year ahead window for all active recurring tasks

---

### Requirement: Idempotent Operation
The batch generation utility SHALL be safe to run multiple times.

#### Scenario: Run twice
- **WHEN** batch generation runs twice in succession
- **THEN** no duplicate tasks are created
- **AND** existing tasks are not affected

#### Scenario: Handle partial previous runs
- **WHEN** batch generation is interrupted
- **THEN** next run picks up where it left off
- **AND** generates only missing instances

---

### Requirement: Error Handling
The batch generation utility SHALL handle errors gracefully.

#### Scenario: Invalid recurring task
- **WHEN** batch generation encounters a recurring task with invalid configuration
- **THEN** it logs the error
- **AND** continues processing other recurring tasks

#### Scenario: Storage full
- **WHEN** localStorage is full during batch generation
- **THEN** it throws an error indicating storage limit
- **AND** partial results may be saved
