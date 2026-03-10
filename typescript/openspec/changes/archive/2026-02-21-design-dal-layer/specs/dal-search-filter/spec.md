## ADDED Requirements

### Requirement: IQueryFilter interface
The system SHALL provide an IQueryFilter interface for building flexible query conditions.

#### Scenario: Create equality filter
- **WHEN** caller creates a filter with field, operator, and value
- **THEN** system returns a filter that matches entities where field equals value

#### Scenario: Create comparison filter
- **WHEN** caller creates a filter with operator greater than, less than
- **THEN** system returns a filter that matches entities based on comparison

#### Scenario: Create text search filter
- **WHEN** caller creates a filter with contains operator
- **THEN** system returns a filter that matches entities where field contains the search text (case-insensitive)

### Requirement: IQueryBuilder interface
The system SHALL provide a query builder for constructing complex queries with multiple filters.

#### Scenario: Add filter to query
- **WHEN** caller invokes queryBuilder.where(field, operator, value)
- **THEN** system adds a filter condition to the query

#### Scenario: Add multiple filters (AND)
- **WHEN** caller adds multiple filter conditions
- **THEN** system combines filters with AND logic by default

#### Scenario: Add OR condition
- **WHEN** caller invokes queryBuilder.orWhere(field, operator, value)
- **THEN** system adds an OR condition to the query

#### Scenario: Apply pagination
- **WHEN** caller invokes queryBuilder.paginate(page, pageSize)
- **THEN** system limits results to specified page size and offset

#### Scenario: Apply sorting
- **WHEN** caller invokes queryBuilder.orderBy(field, direction)
- **THEN** system sorts results by field in ascending or descending order

### Requirement: Async query execution
The system SHALL execute queries asynchronously.

#### Scenario: Execute query asynchronously
- **WHEN** caller awaits queryBuilder.executeAsync()
- **THEN** system returns a Promise resolving to matching entities

#### Scenario: Execute count query
- **WHEN** caller awaits queryBuilder.countAsync()
- **THEN** system returns a Promise resolving to the total count of matching entities
