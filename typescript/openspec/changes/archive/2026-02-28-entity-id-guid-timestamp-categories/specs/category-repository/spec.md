# Category Repository Specification

## ADDED Requirements

### Requirement: ICategoryRepository interface extends IRepository
The system SHALL provide an ICategoryRepository interface that extends IRepository for category-specific operations.

#### Scenario: CategoryRepository provides CRUD
- **WHEN** CategoryRepository implements ICategoryRepository
- **THEN** it MUST provide all standard CRUD operations from IRepository

### Requirement: CategoryRepository generates GUID on create
The system SHALL ensure CategoryRepository generates a GUID for new categories.

#### Scenario: Create category generates ID
- **WHEN** createAsync() is called without an id
- **THEN** it MUST generate and assign a GUID to the category

### Requirement: CategoryRepository handles timestamps
The system SHALL ensure CategoryRepository automatically sets createdAt and updatedAt on categories.

#### Scenario: Create sets createdAt and updatedAt
- **WHEN** a category is created
- **THEN** it MUST have both createdAt and updatedAt set to current timestamp

#### Scenario: Update modifies updatedAt only
- **WHEN** a category is updated
- **THEN** it MUST update only the updatedAt timestamp, leaving createdAt unchanged

### Requirement: CategoryRepository persists to storage
The system SHALL ensure CategoryRepository persists categories to localStorage.

#### Scenario: Categories persist across sessions
- **WHEN** categories are created and app is refreshed
- **THEN** all categories MUST be retrievable from storage
