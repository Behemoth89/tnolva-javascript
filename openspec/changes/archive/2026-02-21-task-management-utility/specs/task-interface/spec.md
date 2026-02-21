## ADDED Requirements

### Requirement: ITask Interface
The system SHALL provide an ITask interface that defines the structure for task objects.

#### Scenario: ITask includes id
- **WHEN** a task object is used
- **THEN** it SHALL have an id property of type string

#### Scenario: ITask includes title
- **WHEN** a task object is used
- **THEN** it SHALL have a title property of type string

#### Scenario: ITask includes description
- **WHEN** a task object is used
- **THEN** it SHALL have an optional description property of type string

#### Scenario: ITask includes status
- **WHEN** a task object is used
- **THEN** it SHALL have a status property of type EStatus

#### Scenario: ITask includes priority
- **WHEN** a task object is used
- **THEN** it SHALL have a priority property of type EPriority

#### Scenario: ITask includes dueDate
- **WHEN** a task object is used
- **THEN** it SHALL have an optional dueDate property of type Date

#### Scenario: ITask includes tags
- **WHEN** a task object is used
- **THEN** it SHALL have an optional tags property of type string array

### Requirement: ITaskCreateDto Interface
The system SHALL provide an ITaskCreateDto interface for creating new tasks.

#### Scenario: ITaskCreateDto validation
- **WHEN** creating a new task
- **THEN** the dto SHALL require id and title, with optional description, status, priority, dueDate, and tags

### Requirement: ITaskUpdateDto Interface
The system SHALL provide an ITaskUpdateDto interface for updating existing tasks.

#### Scenario: ITaskUpdateDto allows partial update
- **WHEN** updating a task
- **THEN** all fields SHALL be optional to allow partial updates
