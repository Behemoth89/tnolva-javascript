## ADDED Requirements

### Requirement: BLL Layer Directory Structure
The BLL SHALL be organized in a dedicated directory with clear separation of concerns.

#### Scenario: BLL directory exists
- **WHEN** project includes BLL layer
- **THEN** there SHALL be a `src/bll/` directory containing service modules

#### Scenario: Service organization
- **WHEN** BLL services are created
- **THEN** each service SHALL be in its own file under `src/bll/services/`

#### Scenario: Interface organization
- **WHEN** BLL interfaces are defined
- **THEN** they SHALL be in `src/bll/interfaces/` following the `I<ServiceName>Service` naming convention

### Requirement: Service Interface Contracts
The BLL SHALL define clear interfaces for all services.

#### Scenario: Task service interface
- **WHEN** task service is created
- **THEN** it SHALL implement `ITaskService` interface with create, update, delete, and query operations

#### Scenario: Category service interface
- **WHEN** category service is created
- **THEN** it SHALL implement `ICategoryService` interface with create, assign, remove, and query operations

#### Scenario: Recurrence service interface
- **WHEN** recurrence service is created
- **THEN** it SHALL implement `IRecurrenceService` interface with template management and task generation operations

### Requirement: Dependency Flow
The BLL SHALL maintain proper dependency direction for clean architecture.

#### Scenario: BLL depends on DAL
- **WHEN** BLL services need data access
- **THEN** they SHALL depend on repository interfaces, not implementations

#### Scenario: BLL uses Domain entities
- **WHEN** BLL services create or modify entities
- **THEN** they SHALL use Domain entity classes from `src/domain/`

#### Scenario: Presentation depends on BLL
- **WHEN** presentation layer needs business operations
- **THEN** it SHALL use BLL services, not access DAL directly

### Requirement: UnitOfWork Integration with BLL
The BLL SHALL integrate with UnitOfWork for transactional operations.

#### Scenario: UoW uses BLL services
- **WHEN** UnitOfWork needs business logic
- **THEN** it SHALL delegate to BLL services rather than contain business logic

#### Scenario: BLL services use UoW for persistence
- **WHEN** BLL services need to save changes
- **THEN** they SHALL use UnitOfWork to commit changes atomically

### Requirement: Service Factory Pattern
The BLL SHALL provide a factory for creating service instances.

#### Scenario: Service factory exists
- **WHEN** application needs BLL services
- **THEN** there SHALL be a `BllServiceFactory` to create service instances with dependencies

#### Scenario: Factory provides UoW
- **WHEN** factory creates services
- **THEN** each service SHALL receive a UnitOfWork instance for data access

### Requirement: Clean Code Principles
The BLL SHALL follow clean code principles.

#### Scenario: Single responsibility
- **WHEN** services are designed
- **THEN** each service SHALL have one primary responsibility

#### Scenario: Descriptive naming
- **WHEN** services, methods, and variables are named
- **THEN** names SHALL be descriptive and self-documenting

#### Scenario: Method size
- **WHEN** methods are implemented
- **THEN** methods SHALL be focused and not too long (prefer under 20 lines)

### Requirement: Interface Prefix Convention
The BLL SHALL follow project naming conventions.

#### Scenario: Interface naming
- **WHEN** interfaces are defined in BLL
- **THEN** they SHALL be prefixed with capital `I` (e.g., `ITaskService`)

#### Scenario: Enum naming
- **WHEN** enums are defined in BLL
- **THEN** they SHALL be prefixed with capital `E` (e.g., `ETaskOperation`)
