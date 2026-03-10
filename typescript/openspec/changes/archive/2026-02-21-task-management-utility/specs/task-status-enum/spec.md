## ADDED Requirements

### Requirement: EStatus Enum
The system SHALL provide an EStatus enum defining all possible task statuses.

#### Scenario: EStatus has TODO value
- **WHEN** a task is in TODO status
- **THEN** the status SHALL be EStatus.TODO

#### Scenario: EStatus has IN_PROGRESS value
- **WHEN** a task is in progress
- **THEN** the status SHALL be EStatus.IN_PROGRESS

#### Scenario: EStatus has DONE value
- **WHEN** a task is completed
- **THEN** the status SHALL be EStatus.DONE

#### Scenario: EStatus has CANCELLED value
- **WHEN** a task is cancelled
- **THEN** the status SHALL be EStatus.CANCELLED

### Requirement: Status Transitions
The system SHALL define valid status transitions.

#### Scenario: TODO can transition to IN_PROGRESS
- **WHEN** a task with TODO status is started
- **THEN** it SHALL transition to IN_PROGRESS

#### Scenario: IN_PROGRESS can transition to DONE
- **WHEN** a task with IN_PROGRESS status is completed
- **THEN** it SHALL transition to DONE

#### Scenario: Any status can transition to CANCELLED
- **WHEN** a task is cancelled
- **THEN** it SHALL transition to CANCELLED from any status
