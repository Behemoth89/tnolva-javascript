## ADDED Requirements

### Requirement: Prevent Direct Circular Dependency
The system SHALL prevent creating a dependency where task A depends on task B AND task B already depends on task A:

- **WHEN** user attempts to add a dependency where task A would depend on task B
- **AND** task B already depends on task A (directly)
- **THEN** system SHALL reject the operation with a validation error
- **AND** system SHALL NOT create the dependency record

#### Scenario: Reject direct circular dependency
- **WHEN** task B already depends on task A
- **AND** user tries to make task A depend on task B
- **THEN** system throws error: "Cannot create dependency: circular reference detected"

### Requirement: Prevent Adding Subtask to a Subtask (v1: Single Level Only)
The system SHALL prevent creating a subtask relationship when the potential subtask already has a parent:

- **WHEN** user attempts to add a subtask to a task
- **AND** the potential subtask already has a parent (already depends on another task)
- **THEN** system SHALL reject the operation with a validation error

#### Scenario: Reject subtask that already has a parent
- **GIVEN** task "Phase 1" is a subtask of "Project A"
- **WHEN** user tries to make "Phase 1" also a subtask of "Project B"
- **THEN** system throws error: "Task already has a parent - v1 supports only single-level subtasks"

### Requirement: Simple Direct Check (v1)
The system SHALL use a simple direct check instead of graph traversal:

- **WHEN** validating a potential dependency
- **THEN** system SHALL check only if the target task already depends on the source task (direct check)
- **AND** system SHALL check if the source task already has a parent

#### Scenario: Simple check for direct dependency
- **GIVEN** task A exists
- **WHEN** user tries to make task B depend on task A
- **THEN** system checks: does A already depend on B? (no, so OK)
- **AND** system checks: does B already have a parent? (no, so OK)

### Requirement: Allow Valid Dependencies
The system SHALL allow non-circular dependencies:

- **WHEN** user creates a dependency that does not form a cycle
- **THEN** system SHALL allow the operation

#### Scenario: Allow valid dependency
- **GIVEN** task A exists
- **GIVEN** task B exists (no existing dependencies)
- **WHEN** user makes task B depend on task A
- **THEN** system allows the dependency

#### Scenario: Allow multiple subtasks under same parent
- **GIVEN** task A is a main task
- **WHEN** user makes task B depend on A
- **AND** user makes task C depend on A
- **THEN** system allows both dependencies (multiple children under same parent OK)
