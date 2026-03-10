## ADDED Requirements

### Requirement: Interface files MUST be organized in subfolders by type
The system SHALL organize interface files into appropriate subfolders based on their purpose:
- Entity interfaces in `src/interfaces/entities/`
- DTO interfaces in `src/interfaces/dtos/`
- Repository interfaces in `src/interfaces/repositories/`

#### Scenario: Entity interfaces are in entities folder
- **WHEN** an entity interface file exists (e.g., ITask, IRecurringTask)
- **THEN** the file MUST be located in `src/interfaces/entities/`

#### Scenario: DTO interfaces are in dtos folder
- **WHEN** a DTO interface file exists (e.g., ITaskCreateDto, ITaskUpdateDto)
- **THEN** the file MUST be located in `src/interfaces/dtos/`

#### Scenario: Repository interfaces are in repositories folder
- **WHEN** a repository interface file exists (e.g., ITaskRepository, ICategoryRepository)
- **THEN** the file MUST be located in `src/interfaces/repositories/`

### Requirement: Entity interfaces MUST have Entity suffix
The system SHALL rename entity interfaces to include "Entity" suffix for clarity.

#### Scenario: Task entity interface renamed
- **WHEN** the task entity interface exists
- **THEN** it MUST be named `ITaskEntity` and located in `src/interfaces/entities/`

#### Scenario: Other entity interfaces renamed
- **WHEN** entity interfaces like IRecurringTask, IRecurrenceTemplate exist
- **THEN** they MUST be renamed to IRecurringTaskEntity, IRecurrenceTemplateEntity respectively

### Requirement: All imports MUST be updated to reflect new structure
The system SHALL update all import statements throughout the codebase to use new interface locations and names.

#### Scenario: Domain layer imports updated
- **WHEN** domain entities import interfaces
- **THEN** imports MUST reference new locations in `src/interfaces/entities/`

#### Scenario: BLL layer imports updated
- **WHEN** BLL services import interfaces
- **THEN** imports MUST reference new interface locations

#### Scenario: Tests import updated
- **WHEN** test files import interfaces
- **THEN** imports MUST reference new interface locations and names
