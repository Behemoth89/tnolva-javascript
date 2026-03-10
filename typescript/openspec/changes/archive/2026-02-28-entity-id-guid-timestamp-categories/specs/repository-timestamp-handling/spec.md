# Repository Timestamp Handling Specification

## ADDED Requirements

### Requirement: BaseRepository generates GUID for entities
The system SHALL ensure BaseRepository uses GUID generation for all new entities.

#### Scenario: createAsync generates GUID
- **WHEN** createAsync() is called on an entity without an id
- **THEN** it MUST generate a GUID using generateGuid()

#### Scenario: createBatchAsync generates GUIDs
- **WHEN** createBatchAsync() is called on entities without ids
- **THEN** it MUST generate a unique GUID for each entity

### Requirement: BaseRepository sets createdAt on entity creation
The system SHALL ensure BaseRepository automatically sets the createdAt timestamp when creating entities.

#### Scenario: Create sets createdAt timestamp
- **WHEN** createAsync() is called
- **THEN** it MUST set the createdAt field to current UTC timestamp in ISO 8601 format

### Requirement: BaseRepository sets updatedAt on entity update
The system SHALL ensure BaseRepository automatically sets the updatedAt timestamp when updating entities.

#### Scenario: Update sets updatedAt timestamp
- **WHEN** updateAsync() is called
- **THEN** it MUST set the updatedAt field to current UTC timestamp in ISO 8601 format

#### Scenario: Update does not modify createdAt
- **WHEN** updateAsync() is called
- **THEN** it MUST NOT modify the createdAt field

### Requirement: BaseRepository timestamp handling works for all entity types
The system SHALL ensure timestamp handling works for any entity extending IBaseEntity.

#### Scenario: Timestamp works for Task
- **WHEN** Task is created via TaskRepository
- **THEN** it MUST have createdAt and updatedAt set automatically

#### Scenario: Timestamp works for TaskCategory
- **WHEN** TaskCategory is created via CategoryRepository
- **THEN** it MUST have createdAt and updatedAt set automatically
