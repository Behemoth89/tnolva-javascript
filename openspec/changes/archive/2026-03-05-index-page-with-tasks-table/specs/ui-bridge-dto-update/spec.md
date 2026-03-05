## ADDED Requirements

### Requirement: UiBridge Returns DTOs for All Services
The system SHALL update UiBridge to return BLL DTOs from all service methods, not just TaskService.

#### Scenario: getAllCategories returns DTOs
- **WHEN** UiBridge.getAllCategories() is called
- **THEN** system returns array of IBllCategoryDto

#### Scenario: createCategory returns DTO
- **WHEN** UiBridge.createCategory() is called
- **THEN** system returns IBllCategoryDto of created category

#### Scenario: getSubtasks returns DTOs
- **WHEN** UiBridge.getSubtasks() is called
- **THEN** system returns array of IBllTaskDto

#### Scenario: getParentTask returns DTO
- **WHEN** UiBridge.getParentTask() is called
- **THEN** system returns IBllTaskDto

### Requirement: UiBridge Methods Follow Consistent Pattern
The system SHALL ensure all UiBridge methods return DTOs following the same pattern as task methods.

#### Scenario: Consistent return types
- **WHEN** UiBridge service methods are called
- **THEN** system returns appropriate BLL DTOs for all methods
