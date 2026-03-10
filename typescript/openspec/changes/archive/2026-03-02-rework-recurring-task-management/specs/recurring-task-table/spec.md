## ADDED Requirements

### Requirement: Recurring Task Creation
The system SHALL allow users to create a recurring task that defines a template for generating future task instances.

#### Scenario: Create recurring task with date range
- **WHEN** user creates a recurring task with title, description, priority, startDate, endDate, and interval
- **THEN** the recurring task is stored with status "ACTIVE"
- **AND** task instances are generated from startDate to endDate based on interval

#### Scenario: Create recurring task indefinitely
- **WHEN** user creates a recurring task without endDate (indefinite)
- **THEN** the recurring task is stored with status "ACTIVE"
- **AND** task instances are generated for 1 year ahead from startDate
- **AND** new instances are generated as time progresses

#### Scenario: Recurring task with complex interval
- **WHEN** user creates a recurring task with multiple intervals (e.g., every 2 weeks on Monday)
- **THEN** the system SHALL calculate all matching dates based on the interval configuration

---

### Requirement: Recurring Task Fields
A recurring task SHALL contain all fields needed to generate task instances.

#### Scenario: Required fields
- **WHEN** user provides title, priority, startDate, and interval
- **THEN** the recurring task is created successfully

#### Scenario: Optional fields
- **WHEN** user provides optional fields (description, tags, categoryIds)
- **THEN** those fields are stored and passed to generated task instances

#### Scenario: Indefinite recurrence
- **WHEN** user leaves endDate empty/null
- **THEN** the recurring task is marked as indefinite
- **AND** generation continues until manually stopped

---

### Requirement: Recurring Task Storage
The system SHALL persist recurring tasks in a dedicated storage.

#### Scenario: Persist to localStorage
- **WHEN** recurring task is created
- **THEN** it is stored in localStorage under the recurring tasks key

#### Scenario: Retrieve all recurring tasks
- **WHEN** requesting all recurring tasks
- **THEN** the system returns all stored recurring tasks including inactive ones
