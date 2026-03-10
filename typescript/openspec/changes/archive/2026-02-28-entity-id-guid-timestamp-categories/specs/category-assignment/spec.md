# Category Assignment Specification

## ADDED Requirements

### Requirement: ITaskCategoryAssignment interface defines junction table
The system SHALL provide an ITaskCategoryAssignment interface for the many-to-many relationship with its own GUID id.

#### Scenario: Assignment has id
- **WHEN** an assignment is created
- **THEN** it MUST have a non-empty string `id` property (UUID v4)

#### Scenario: Assignment has taskId
- **WHEN** an assignment is created
- **THEN** it MUST have a non-empty string `taskId` property

#### Scenario: Assignment has categoryId
- **WHEN** an assignment is created
- **THEN** it MUST have a non-empty string `categoryId` property

#### Scenario: Assignment has assignedAt timestamp
- **WHEN** an assignment is created
- **THEN** it MUST have an `assignedAt` timestamp in ISO 8601 format

### Requirement: Assignment implements IBaseEntity
The system SHALL ensure assignments have timestamps via IBaseEntity.

#### Scenario: Assignment has createdAt
- **WHEN** an assignment is created
- **THEN** it MUST have a `createdAt` timestamp

#### Scenario: Assignment has updatedAt
- **WHEN** an assignment is created
- **THEN** it MUST have an `updatedAt` timestamp

### Requirement: Unique constraint on task-category pair
The system SHALL ensure each task-category pair is unique.

#### Scenario: Duplicate assignment rejected
- **WHEN** attempting to assign same task to same category twice
- **THEN** it MUST NOT create duplicate assignments

### Requirement: Get categories for a task
The system SHALL provide a way to get all categories assigned to a task.

#### Scenario: Get categories by taskId
- **WHEN** querying categories for a task
- **THEN** it MUST return all categories assigned to that task

### Requirement: Get tasks for a category
The system SHALL provide a way to get all tasks assigned to a category.

#### Scenario: Get tasks by categoryId
- **WHEN** querying tasks for a category
- **THEN** it MUST return all tasks assigned to that category

### Requirement: Remove task-category assignment
The system SHALL allow removing a task from a category.

#### Scenario: Remove assignment
- **WHEN** an assignment is deleted
- **THEN** the task is no longer associated with that category
