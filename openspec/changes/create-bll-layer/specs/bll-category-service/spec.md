## ADDED Requirements

### Requirement: Category Creation Service
The BLL SHALL provide an async category creation service that handles business rules for categories.

#### Scenario: Create category with name
- **WHEN** client provides a valid category name
- **THEN** service creates a new category with generated ID and timestamps asynchronously

#### Scenario: Create category with duplicate name
- **WHEN** client provides a name that already exists (case-insensitive)
- **THEN** service SHALL return the existing category asynchronously instead of creating duplicate

#### Scenario: Create category with empty name
- **WHEN** client provides empty or whitespace-only name
- **THEN** service SHALL throw validation error asynchronously

### Requirement: Task-Category Assignment Service
The BLL SHALL manage async task-category assignments with business rule enforcement.

#### Scenario: Assign task to category
- **WHEN** client requests to assign a task to a category
- **THEN** service validates both task and category exist asynchronously, then creates assignment

#### Scenario: Assign task to invalid category
- **WHEN** client assigns task to non-existent category
- **THEN** service SHALL return null asynchronously and not create assignment

#### Scenario: Assign task that doesn't exist
- **WHEN** client assigns non-existent task to category
- **THEN** service SHALL return null asynchronously and not create assignment

#### Scenario: Duplicate assignment
- **WHEN** client attempts to assign same task to same category twice
- **THEN** service returns existing assignment asynchronously without creating duplicate

#### Scenario: Remove task from category
- **WHEN** client requests to remove task-category assignment
- **THEN** service removes assignment asynchronously if it exists

#### Scenario: Remove non-existent assignment
- **WHEN** client attempts to remove assignment that doesn't exist
- **THEN** service returns false asynchronously with no error

### Requirement: Category Query Service
The BLL SHALL provide async querying capabilities for categories and assignments.

#### Scenario: Get categories for task
- **WHEN** client requests all categories for a specific task
- **THEN** service returns array of categories assigned to that task asynchronously

#### Scenario: Get tasks for category
- **WHEN** client requests all task IDs for a specific category
- **THEN** service returns array of task IDs assigned to that category asynchronously

#### Scenario: Get category by name
- **WHEN** client queries category by exact name
- **THEN** service returns category asynchronously if found, null otherwise
