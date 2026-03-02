## ADDED Requirements

### Requirement: Add Task Dependency
The system SHALL allow adding a dependency relationship between two tasks:

- **WHEN** adding a dependency where task A depends on task B
- **THEN** repository SHALL create a new TaskDependency record
- **AND** return the created dependency with generated id

#### Scenario: Add subtask dependency
- **WHEN** service calls `addDependency(subtaskId, mainTaskId, SUBTASK)`
- **THEN** repository creates TaskDependency with task_id = subtaskId, depends_on_task_id = mainTaskId
- **AND** repository generates unique id for the record
- **AND** repository returns the created TaskDependency object

### Requirement: Remove Task Dependency
The system SHALL allow removing a dependency relationship:

- **WHEN** removing a dependency by its id
- **THEN** repository SHALL delete the TaskDependency record
- **AND** not affect the related tasks

#### Scenario: Remove dependency by id
- **WHEN** service calls `removeDependency(dependencyId)`
- **THEN** repository deletes the TaskDependency record with that id

### Requirement: Get Dependencies for Task
The system SHALL allow querying all tasks that a given task depends on:

- **WHEN** querying dependencies for a task
- **THEN** repository SHALL return all TaskDependency records where task_id equals the given task id

#### Scenario: Get tasks this task depends on
- **WHEN** service calls `getDependenciesForTask(taskId)`
- **THEN** repository returns array of TaskDependency where task_id = taskId (tasks this task depends on)

### Requirement: Get Dependent Tasks
The system SHALL allow querying all tasks that depend on a given task:

- **WHEN** querying dependent tasks
- **THEN** repository SHALL return all TaskDependency records where depends_on_task_id equals the given task id

#### Scenario: Get subtasks of a task
- **WHEN** service calls `getDependents(taskId)` (tasks that depend on this task)
- **THEN** repository returns array of TaskDependency where depends_on_task_id = taskId

### Requirement: Check Dependency Exists
The system SHALL allow checking if a specific dependency relationship exists:

- **WHEN** checking if task A depends on task B
- **THEN** repository SHALL return true if a TaskDependency record exists with task_id = A AND depends_on_task_id = B

#### Scenario: Check if dependency exists
- **WHEN** service calls `hasDependency(taskId, dependsOnTaskId)`
- **THEN** repository returns true if such dependency exists, false otherwise

### Requirement: Get All Dependencies
The system SHALL allow retrieving all dependency records:

- **WHEN** querying all dependencies
- **THEN** repository SHALL return all TaskDependency records in the database

#### Scenario: Get all dependencies
- **WHEN** service calls `getAll()`
- **THEN** repository returns array of all TaskDependency records
