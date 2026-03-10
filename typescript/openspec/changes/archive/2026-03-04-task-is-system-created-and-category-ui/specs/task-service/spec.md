## MODIFIED Requirements

### Requirement: TaskService uses BLL DTOs
The TaskService SHALL use BLL-specific DTOs instead of data layer DTOs.

#### Scenario: Service create uses BLL DTO
- **WHEN** TaskService.createAsync() is called
- **THEN** it SHALL accept IBllTaskCreateDto (with categoryId)
- **AND** it SHALL return IBllTaskDto (with category info)

#### Scenario: Service update uses BLL DTO
- **WHEN** TaskService.updateAsync() is called
- **THEN** it SHALL accept IBllTaskUpdateDto (with categoryId)
- **AND** it SHALL return IBllTaskDto (with category info)

#### Scenario: Service queries return BLL DTO
- **WHEN** TaskService.getAllAsync(), getByIdAsync(), getByStatusAsync(), getByPriorityAsync() are called
- **THEN** they SHALL return IBllTaskDto with category information joined from junction table
- **AND** the category fields SHALL include categoryId, categoryName, and categoryColor

### Requirement: TaskService creates task with category assignment
The TaskService SHALL create an ITaskCategoryAssignmentEntity junction record when a categoryId is provided in the create DTO.

#### Scenario: Create task with categoryId
- **WHEN** TaskService.createAsync() is called with IBllTaskCreateDto containing categoryId
- **THEN** the service SHALL create the task entity
- **AND** the service SHALL create an ITaskCategoryAssignmentEntity with the taskId and categoryId
- **AND** both operations SHALL be committed in a single transaction via UnitOfWork

#### Scenario: Create task without categoryId
- **WHEN** TaskService.createAsync() is called with IBllTaskCreateDto without categoryId
- **THEN** the service SHALL create the task entity
- **AND** no category assignment SHALL be created

### Requirement: TaskService updates task with category assignment
The TaskService SHALL update the category assignment when a categoryId is provided in the update DTO.

#### Scenario: Update task category to new value
- **WHEN** TaskService.updateAsync() is called with IBllTaskUpdateDto containing a different categoryId
- **THEN** the service SHALL update the task
- **AND** the existing category assignment SHALL be replaced with the new one

#### Scenario: Update task to clear category
- **WHEN** TaskService.updateAsync() is called with IBllTaskUpdateDto that clears the category
- **THEN** the service SHALL update the task
- **AND** the existing category assignment SHALL be deleted

#### Scenario: Update task without changing category
- **WHEN** TaskService.updateAsync() is called with IBllTaskUpdateDto that does not include categoryId
- **THEN** the service SHALL update the task
- **AND** the existing category assignment SHALL remain unchanged

### Requirement: TaskService deletes task and category assignment
The TaskService SHALL delete the category assignment when a task is deleted.

#### Scenario: Delete task with category
- **WHEN** TaskService.deleteAsync() is called for a task that has a category assignment
- **THEN** the service SHALL delete the task
- **AND** the category assignment SHALL also be deleted
- **AND** both operations SHALL be committed in a single transaction via UnitOfWork

#### Scenario: Delete task without category
- **WHEN** TaskService.deleteAsync() is called for a task that has no category assignment
- **THEN** the service SHALL delete the task
- **AND** no additional operations are needed
