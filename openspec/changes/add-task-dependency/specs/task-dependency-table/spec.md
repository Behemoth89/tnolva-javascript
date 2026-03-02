## ADDED Requirements

### Requirement: Task Dependency Junction Table
The system SHALL store task dependencies using a junction table pattern with the following structure:

- **id**: string (GUID) - unique identifier for the dependency record
- **task_id**: string - the dependent task (child/subtask)
- **depends_on_task_id**: string - the task being depended on (parent/main task)
- **dependency_type**: enum - type of dependency (e.g., SUBTASK)
- **created_at**: timestamp - when the dependency was created
- **updated_at**: timestamp - when the dependency was last updated

#### Scenario: Create new dependency
- **WHEN** user adds a subtask to a main task
- **THEN** system creates a new TaskDependency record with unique id
- **AND** system sets task_id to the subtask's id
- **AND** system sets depends_on_task_id to the main task's id
- **AND** system sets dependency_type to SUBTASK

#### Scenario: Query dependencies for a task
- **WHEN** system needs to find all subtasks of a task
- **THEN** system queries TaskDependency where depends_on_task_id equals the main task's id

#### Scenario: Query dependents for a task
- **WHEN** system needs to find which tasks depend on a given task
- **THEN** system queries TaskDependency where task_id equals the given task's id

#### Scenario: Remove dependency
- **WHEN** user removes a subtask from a main task
- **THEN** system deletes the corresponding TaskDependency record
- **AND** both tasks remain intact in the database

### Requirement: Dependency Type Enum
The system SHALL define an EDependencyType enum with at least one value:

- **SUBTASK**: Indicates the dependent task is a subtask of the parent task

#### Scenario: Create SUBTASK dependency
- **WHEN** user creates a subtask relationship
- **THEN** system stores dependency_type as "subtask"

### Requirement: Cascade Delete
The system SHALL handle deletion of tasks with dependencies:

- **WHEN** a task is deleted
- **THEN** system SHALL delete all TaskDependency records where task_id equals the deleted task's id
- **AND** system SHALL delete all TaskDependency records where depends_on_task_id equals the deleted task's id

#### Scenario: Delete task with subtasks
- **WHEN** user deletes a main task that has subtasks
- **THEN** system deletes the main task
- **AND** system deletes all TaskDependency records linking to the main task
- **AND** subtask tasks remain in the database

#### Scenario: Delete subtask
- **WHEN** user deletes a task that is a subtask of another task
- **THEN** system deletes the subtask
- **AND** system deletes the TaskDependency record linking them
- **AND** the main task remains in the database
