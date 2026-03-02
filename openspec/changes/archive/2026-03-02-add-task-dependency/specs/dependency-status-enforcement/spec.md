## ADDED Requirements

### Requirement: Prevent Completing Main Task with Incomplete Subtasks
The system SHALL prevent marking a main task as DONE when it has incomplete subtasks:

- **WHEN** user attempts to update a main task's status to DONE
- **AND** the task has one or more subtasks (dependencies where task is the parent)
- **AND** at least one subtask has status not equal to DONE
- **THEN** system SHALL reject the status update with a validation error
- **AND** the main task's status SHALL NOT be changed

#### Scenario: Reject completing main task with incomplete subtask
- **GIVEN** task "Build House" exists with status IN_PROGRESS
- **AND** task "Pour Foundation" exists as a subtask of "Build House" with status IN_PROGRESS
- **WHEN** user tries to mark "Build House" as DONE
- **THEN** system throws error: "Cannot complete main task: subtask 'Pour Foundation' is not done"

#### Scenario: Reject completing main task with all but one subtask incomplete
- **GIVEN** main task has 3 subtasks
- **AND** 2 subtasks are DONE, 1 subtask is IN_PROGRESS
- **WHEN** user tries to mark main task as DONE
- **THEN** system throws error indicating incomplete subtasks

### Requirement: Allow Completing Main Task When All Subtasks Are Done
The system SHALL allow marking a main task as DONE when all its subtasks are DONE:

- **WHEN** user attempts to update a main task's status to DONE
- **AND** all subtasks have status equal to DONE
- **THEN** system SHALL allow the status update

#### Scenario: Allow completing main task when all subtasks done
- **GIVEN** task "Build House" exists
- **AND** task "Pour Foundation" is a subtask with status DONE
- **AND** task "Build Walls" is a subtask with status DONE
- **WHEN** user marks "Build House" as DONE
- **THEN** system allows the status change

### Requirement: Allow Completing Tasks Without Subtasks
The system SHALL allow marking any task as DONE when it has no subtasks:

- **WHEN** user attempts to update a task's status to DONE
- **AND** the task has no subtasks (no tasks depend on it)
- **THEN** system SHALL allow the status update without additional checks

#### Scenario: Allow completing task without subtasks
- **GIVEN** task "Simple Task" exists with no subtasks
- **WHEN** user marks "Simple Task" as DONE
- **THEN** system allows the status change

### Requirement: Check Subtask Status Before Update
The system SHALL check subtask status before allowing main task status update:

- **WHEN** service receives request to update task status to DONE
- **AND** there are tasks that depend on this task (subtasks)
- **THEN** service SHALL query for all subtask statuses
- **AND** proceed with validation before applying the update

#### Scenario: Status check happens before database update
- **WHEN** user updates main task status to DONE
- **THEN** system first checks all subtask statuses in memory
- **AND** only updates the main task if all subtasks are DONE
- **AND** rolls back if validation fails

### Requirement: Clear Error Messages
The system SHALL provide clear error messages indicating which subtasks are incomplete:

- **WHEN** main task cannot be completed due to incomplete subtasks
- **THEN** error message SHALL include the titles or ids of incomplete subtasks

#### Scenario: Error message lists incomplete subtasks
- **WHEN** main task has 2 incomplete subtasks: "Subtask A" and "Subtask B"
- **AND** user tries to mark main task as DONE
- **THEN** error message reads: "Cannot complete: incomplete subtasks - Subtask A, Subtask B"
