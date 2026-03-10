## ADDED Requirements

### Requirement: Combined interface files MUST be split into separate files
The system SHALL separate interface files that contain multiple interface definitions into individual files.

#### Scenario: IRecurringTask file split
- **WHEN** IRecurringTask.ts contains IRecurringTask, IRecurringTaskCreateDto, and IRecurringTaskUpdateDto
- **THEN** they MUST be separated into:
  - `src/interfaces/entities/IRecurringTaskEntity.ts`
  - `src/interfaces/dtos/IRecurringTaskCreateDto.ts`
  - `src/interfaces/dtos/IRecurringTaskUpdateDto.ts`

#### Scenario: ITaskDependency file split
- **WHEN** ITaskDependency.ts contains ITaskDependency and ITaskDependencyCreateDto
- **THEN** they MUST be separated into:
  - `src/interfaces/entities/ITaskDependencyEntity.ts`
  - `src/interfaces/dtos/ITaskDependencyCreateDto.ts`

#### Scenario: ISubtaskTemplate file split
- **WHEN** ISubtaskTemplate.ts contains ISubtaskTemplate and ISubtaskTemplateCreateDto
- **THEN** they MUST be separated into:
  - `src/interfaces/entities/ISubtaskTemplate.ts`
  - `src/interfaces/dtos/ISubtaskTemplateCreateDto.ts`

### Requirement: Each interface file MUST contain exactly one interface
The system SHALL ensure that each interface file contains only one interface definition.

#### Scenario: Single interface per file
- **WHEN** an interface file is examined
- **THEN** it MUST contain exactly one interface export (excluding type imports)

#### Scenario: DTOs in separate files
- **WHEN** CreateDto or UpdateDto interfaces exist
- **THEN** they MUST be in their own files in the dtos/ folder
