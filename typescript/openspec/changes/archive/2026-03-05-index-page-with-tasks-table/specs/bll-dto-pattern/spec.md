## ADDED Requirements

### Requirement: CategoryService Uses BLL DTOs
The system SHALL return IBllCategoryDto from CategoryService methods instead of raw ITaskCategoryEntity.

#### Scenario: getAllAsync returns DTOs
- **WHEN** CategoryService.getAllAsync() is called
- **THEN** system returns array of IBllCategoryDto with id, name, color, taskCount

#### Scenario: getByIdAsync returns DTO
- **WHEN** CategoryService.getByIdAsync() is called
- **THEN** system returns IBllCategoryDto with id, name, color, taskCount

#### Scenario: createAsync returns DTO
- **WHEN** CategoryService.createAsync() is called
- **THEN** system returns IBllCategoryDto of created category

### Requirement: TaskDependencyService Uses BLL DTOs
The system SHALL return BLL DTOs from TaskDependencyService methods.

#### Scenario: getSubtasksAsync returns DTOs
- **WHEN** TaskDependencyService.getSubtasksAsync() is called
- **THEN** system returns array of IBllTaskDto (not raw ITaskEntity)

#### Scenario: getParentTaskAsync returns DTO
- **WHEN** TaskDependencyService.getParentTaskAsync() is called
- **THEN** system returns IBllTaskDto of parent task

### Requirement: RecurrenceService Uses BLL DTOs
The system SHALL return BLL DTOs from RecurrenceService methods.

#### Scenario: RecurrenceService returns DTOs
- **WHEN** RecurrenceService methods are called
- **THEN** system returns appropriate BLL DTOs

### Requirement: RecurringTaskService Uses BLL DTOs
The system SHALL return BLL DTOs from RecurringTaskService methods.

#### Scenario: RecurringTaskService returns DTOs
- **WHEN** RecurringTaskService methods are called
- **THEN** system returns appropriate BLL DTOs

### Requirement: DTO Interfaces Follow Naming Convention
The system SHALL use IBll<Entity>Dto naming pattern for all BLL DTOs.

#### Scenario: DTO naming
- **WHEN** creating new DTO interfaces
- **THEN** system names them IBll<Entity>Dto, IBll<Entity>CreateDto, IBll<Entity>UpdateDto
