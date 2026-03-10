## MODIFIED Requirements

### Requirement: Task repository handles new field
The task repository SHALL handle queries and storage for the new `isSystemCreated` field.

#### Scenario: Repository stores isSystemCreated
- **WHEN** a task is created or updated with `isSystemCreated` value
- **THEN** the repository SHALL persist the `isSystemCreated` value

#### Scenario: Repository queries by isSystemCreated
- **WHEN** a query filters tasks by `isSystemCreated`
- **THEN** the repository SHALL return only tasks matching the filter
