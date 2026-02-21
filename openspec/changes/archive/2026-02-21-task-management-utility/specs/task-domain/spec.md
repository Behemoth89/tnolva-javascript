## ADDED Requirements

### Requirement: Task Entity
The system SHALL provide a Task entity with all required properties for task management.

#### Scenario: Create task with all properties
- **WHEN** a new task is created with id, title, description, status, priority, dueDate, and tags
- **THEN** the system SHALL store all provided values correctly

#### Scenario: Task has required id
- **WHEN** a task is created
- **THEN** the system SHALL require a unique identifier (id)

#### Scenario: Task has required title
- **WHEN** a task is created
- **THEN** the system SHALL require a non-empty title

#### Scenario: Task has optional description
- **WHEN** a task is created with description
- **THEN** the system SHALL store the description value

#### Scenario: Task has status
- **WHEN** a task is created
- **THEN** the system SHALL have a status field from EStatus enum

#### Scenario: Task has priority
- **WHEN** a task is created
- **THEN** the system SHALL have a priority field from EPriority enum

#### Scenario: Task has optional dueDate
- **WHEN** a task is created with a due date
- **THEN** the system SHALL store the dueDate value

#### Scenario: Task has optional tags
- **WHEN** a task is created with tags
- **THEN** the system SHALL store an array of tag strings
