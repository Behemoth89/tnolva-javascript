## ADDED Requirements

### Requirement: Task Relationships
The system SHALL define relationships between tasks and other entities.

#### Scenario: Task belongs to project
- **WHEN** a task is associated with a project
- **THEN** the task SHALL have an optional projectId property

#### Scenario: Task assigned to user
- **WHEN** a task is assigned to a user
- **THEN** the task SHALL have an optional assigneeId property

#### Scenario: Task created by user
- **WHEN** a task is created
- **THEN** the task SHALL have a creatorId property identifying the creator

#### Scenario: Task has tags
- **WHEN** a task has tags
- **THEN** the tags SHALL be stored as an array of strings

### Requirement: ITaskRelationship Interface
The system SHALL provide interfaces for task relationships.

#### Scenario: ITaskWithRelations includes all relations
- **WHEN** a task with relations is used
- **THEN** it SHALL include optional projectId, assigneeId, and creatorId
