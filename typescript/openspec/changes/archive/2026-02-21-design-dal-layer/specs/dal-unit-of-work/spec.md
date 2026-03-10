## ADDED Requirements

### Requirement: IUnitOfWork interface
The system SHALL provide an IUnitOfWork interface that coordinates multiple repository operations within a single transaction scope.

#### Scenario: Begin transaction
- **WHEN** caller invokes unitOfWork.begin()
- **THEN** system starts a new transaction context

#### Scenario: Register new entity
- **WHEN** caller registers a new entity via unitOfWork.registerNew(entity)
- **THEN** system tracks the entity for insertion on commit

#### Scenario: Register modified entity
- **WHEN** caller registers a modified entity via unitOfWork.registerModified(entity)
- **THEN** system tracks the entity for update on commit

#### Scenario: Register deleted entity
- **WHEN** caller registers a deleted entity via unitOfWork.registerDeleted(entity)
- **THEN** system tracks the entity for deletion on commit

#### Scenario: Commit transaction
- **WHEN** caller invokes unitOfWork.commit()
- **THEN** system applies all registered changes to storage atomically

#### Scenario: Rollback transaction
- **WHEN** caller invokes unitOfWork.rollback()
- **THEN** system discards all registered changes without modifying storage

### Requirement: IUnitOfWorkFactory
The system SHALL provide an IUnitOfWorkFactory to create UnitOfWork instances.

#### Scenario: Create UnitOfWork
- **WHEN** caller invokes factory.create()
- **THEN** system returns a new UnitOfWork instance
