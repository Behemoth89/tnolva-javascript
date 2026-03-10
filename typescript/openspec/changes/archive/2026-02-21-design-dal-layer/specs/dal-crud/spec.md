## ADDED Requirements

### Requirement: Async CRUD operations
The system SHALL provide asynchronous Create, Read, Update, and Delete operations for all entities.

#### Scenario: Create entity asynchronously
- **WHEN** caller awaits repository.createAsync(entity)
- **THEN** system generates a unique ID, stores the entity, and returns the created entity with assigned ID

#### Scenario: Read all entities asynchronously
- **WHEN** caller awaits repository.getAllAsync()
- **THEN** system returns a Promise resolving to an array of all entities

#### Scenario: Read entity by ID asynchronously
- **WHEN** caller awaits repository.getByIdAsync(id)
- **THEN** system returns a Promise resolving to the entity with matching ID, or null if not found

#### Scenario: Update entity asynchronously
- **WHEN** caller awaits repository.updateAsync(id, updates)
- **THEN** system updates the entity in storage and returns the updated entity

#### Scenario: Delete entity asynchronously
- **WHEN** caller awaits repository.deleteAsync(id)
- **THEN** system removes the entity from storage and returns true, or returns false if not found

### Requirement: Batch operations
The system SHALL support batch create, update, and delete operations.

#### Scenario: Batch create
- **WHEN** caller awaits repository.createBatchAsync(entities)
- **THEN** system creates all entities and returns array of created entities with assigned IDs

#### Scenario: Batch delete
- **WHEN** caller awaits repository.deleteBatchAsync(ids)
- **THEN** system removes all matching entities from storage and returns count of deleted items

### Requirement: Existence check
The system SHALL provide methods to check if an entity exists without full retrieval.

#### Scenario: Check entity exists
- **WHEN** caller awaits repository.existsAsync(id)
- **THEN** system returns a Promise resolving to true if entity exists, false otherwise
