## ADDED Requirements

### Requirement: Soft Delete Base Entity
All entities that extend BaseEntity SHALL include soft delete functionality through a `deletedAt` timestamp field.

#### Scenario: Entity has deletedAt field
- **WHEN** an entity extends BaseEntity
- **THEN** it SHALL have a `deletedAt` column of type timestamp that is nullable
- **AND** the column SHALL default to null
- **AND** the column SHALL be indexed for query performance

#### Scenario: Deleted record has timestamp
- **WHEN** a record is soft deleted
- **THEN** the `deletedAt` field SHALL be set to the current timestamp
- **AND** the record SHALL NOT be physically removed from the database

### Requirement: Automatic Query Filtering
The system SHALL automatically filter out soft-deleted records from standard queries without requiring manual filtering in each repository method.

#### Scenario: Standard query excludes deleted records
- **WHEN** a repository method queries for entities without specifying deletedAt
- **THEN** the query SHALL automatically include `WHERE deletedAt IS NULL`
- **AND** soft-deleted records SHALL NOT be returned in results

#### Scenario: Query includes deleted records with option
- **WHEN** a repository method is called with `{ withDeleted: true }` option
- **THEN** the query SHALL return both active and soft-deleted records
- **AND** the `deletedAt` field SHALL be populated for deleted records

### Requirement: Soft Delete Operations
The system SHALL provide soft delete, hard delete, and restore operations for all entities.

#### Scenario: Soft delete operation
- **WHEN** a DELETE request is made to an entity endpoint
- **THEN** the record SHALL be soft deleted by setting `deletedAt` to current timestamp
- **AND** the response SHALL return 204 No Content
- **AND** subsequent standard queries SHALL NOT include the record

#### Scenario: Hard delete operation
- **WHEN** a hard delete is explicitly requested via repository method
- **THEN** the record SHALL be physically removed from the database
- **AND** the operation SHALL bypass soft delete logic

#### Scenario: Restore deleted record
- **WHEN** a restore operation is called on a soft-deleted record
- **THEN** the `deletedAt` field SHALL be set to null
- **AND** the record SHALL become visible in standard queries again

### Requirement: Repository Methods for Soft Delete
Each repository SHALL provide methods for soft delete, hard delete, and restore operations.

#### Scenario: Repository has soft delete method
- **WHEN** working with any entity repository
- **THEN** there SHALL be a `softDelete(id)` method available
- **AND** the method SHALL set deletedAt timestamp

#### Scenario: Repository has restore method
- **WHEN** working with any entity repository
- **THEN** there SHALL be a `restore(id)` method available
- **AND** the method SHALL set deletedAt to null

#### Scenario: Repository has hard delete method
- **WHEN** working with any entity repository
- **THEN** there SHALL be a `hardDelete(id)` method available
- **AND** the method SHALL permanently remove the record

### Requirement: Soft Delete on All Entities
All current and future entities SHALL inherit soft delete functionality from BaseEntity.

#### Scenario: User entity supports soft delete
- **WHEN** a User record is deleted
- **THEN** it SHALL be soft deleted with deletedAt timestamp set
- **AND** the user SHALL NOT be able to authenticate

#### Scenario: New entity automatically has soft delete
- **WHEN** a new entity class is created extending BaseEntity
- **THEN** it SHALL automatically have soft delete functionality
- **AND** no additional configuration SHALL be required

### Requirement: Admin Access to Deleted Records
The system SHALL provide a way for administrators to query and manage soft-deleted records.

#### Scenario: Admin queries deleted records
- **WHEN** an admin user queries with `includeDeleted=true`
- **THEN** the response SHALL include soft-deleted records
- **AND** each record SHALL indicate its deleted status

#### Scenario: Admin restores deleted record
- **WHEN** an admin requests to restore a soft-deleted record
- **THEN** the record SHALL be restored with deletedAt set to null
- **AND** the record SHALL be accessible in standard queries
