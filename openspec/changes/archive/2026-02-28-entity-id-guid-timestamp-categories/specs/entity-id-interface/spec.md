# Entity ID Interface Specification

## ADDED Requirements

### Requirement: IEntityId interface defines entity identifier
The system SHALL provide a reusable IEntityId interface that defines the `id` property structure for all entities.

#### Scenario: Interface defines string id
- **WHEN** a type implements IEntityId
- **THEN** it MUST have an `id` property of type string

### Requirement: Entities can implement IEntityId
The system SHALL allow any entity to implement IEntityId for consistent ID handling.

#### Scenario: Task implements IEntityId
- **WHEN** Task class implements IEntityId
- **THEN** it MUST have a string id property

### Requirement: IEntityId enables generic ID operations
The system SHALL support generic operations on entities that implement IEntityId.

#### Scenario: Repository extracts entity ID
- **WHEN** BaseRepository calls getEntityId() on an entity
- **THEN** it MUST return a string value
