# Base Entity Timestamps Specification

## ADDED Requirements

### Requirement: IBaseEntity interface defines timestamp fields
The system SHALL provide an IBaseEntity interface that defines `createdAt` and `updatedAt` timestamp fields.

#### Scenario: Interface defines createdAt field
- **WHEN** a type implements IBaseEntity
- **THEN** it MUST have a `createdAt` property of type string in ISO 8601 format

#### Scenario: Interface defines updatedAt field
- **WHEN** a type implements IBaseEntity
- **THEN** it MUST have an `updatedAt` property of type string in ISO 8601 format

### Requirement: Entities extend IBaseEntity for timestamps
The system SHALL allow entities to extend IBaseEntity to inherit timestamp functionality.

#### Scenario: Task extends IBaseEntity
- **WHEN** Task implements IBaseEntity
- **THEN** it MUST include createdAt and updatedAt properties

### Requirement: Timestamps use UTC ISO 8601 format
The system SHALL store all timestamps in UTC ISO 8601 format.

#### Scenario: Timestamp format compliance
- **WHEN** a timestamp is generated
- **THEN** it MUST be in ISO 8601 format (e.g., "2024-01-15T10:30:00.000Z")
