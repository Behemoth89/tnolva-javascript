## ADDED Requirements

### Requirement: IRepository interface
The system SHALL provide a generic IRepository<T> interface that defines standard data access operations for any entity type.

#### Scenario: Get all entities
- **WHEN** caller invokes repository.getAll()
- **THEN** system returns all entities of type T as an array

#### Scenario: Get entity by ID
- **WHEN** caller invokes repository.getById(id)
- **THEN** system returns the entity with matching ID, or null if not found

#### Scenario: Query with filter
- **WHEN** caller invokes repository.find(filter)
- **THEN** system returns entities matching the filter criteria

### Requirement: ITaskRepository specialization
The system SHALL provide an ITaskRepository interface that extends IRepository<Task> with task-specific query methods.

#### Scenario: Get tasks by status
- **WHEN** caller invokes taskRepository.getByStatus(status)
- **THEN** system returns all tasks with the specified EStatus

#### Scenario: Get tasks by priority
- **WHEN** caller invokes taskRepository.getByPriority(priority)
- **THEN** system returns all tasks with the specified EPriority

### Requirement: Repository implementation
The system SHALL provide a TaskRepository implementation that fulfills the ITaskRepository contract using LocalStorage.

#### Scenario: Persist new task
- **WHEN** caller creates a new task via repository
- **THEN** system assigns a unique ID and stores the task in LocalStorage

#### Scenario: Update existing task
- **WHEN** caller modifies a task via repository
- **THEN** system updates the task in LocalStorage

#### Scenario: Delete task
- **WHEN** caller removes a task via repository
- **THEN** system removes the task from LocalStorage
