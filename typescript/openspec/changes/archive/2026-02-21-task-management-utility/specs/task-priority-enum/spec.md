## ADDED Requirements

### Requirement: EPriority Enum
The system SHALL provide an EPriority enum defining all possible task priorities.

#### Scenario: EPriority has LOW value
- **WHEN** a task has LOW priority
- **THEN** the priority SHALL be EPriority.LOW

#### Scenario: EPriority has MEDIUM value
- **WHEN** a task has MEDIUM priority
- **THEN** the priority SHALL be EPriority.MEDIUM

#### Scenario: EPriority has HIGH value
- **WHEN** a task has HIGH priority
- **THEN** the priority SHALL be EPriority.HIGH

#### Scenario: EPriority has URGENT value
- **WHEN** a task has URGENT priority
- **THEN** the priority SHALL be EPriority.URGENT

### Requirement: Priority Values
The system SHALL assign numeric values to priorities for sorting.

#### Scenario: Priority order is preserved
- **WHEN** priorities are compared
- **THEN** URGENT > HIGH > MEDIUM > LOW in terms of urgency
