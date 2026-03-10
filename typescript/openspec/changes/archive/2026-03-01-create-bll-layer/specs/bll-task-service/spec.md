## ADDED Requirements

### Requirement: Task Creation Service
The BLL SHALL provide a dedicated async task creation service that encapsulates all business rules for creating new tasks.

#### Scenario: Create task with all fields
- **WHEN** client provides title, description, priority, dueDate, and tags
- **THEN** service creates a valid Task entity with generated ID and timestamps asynchronously

#### Scenario: Create task with minimal fields
- **WHEN** client provides only title
- **THEN** service creates Task with default status (TODO), default priority (MEDIUM), and empty tags array asynchronously

#### Scenario: Create task with invalid title
- **WHEN** client provides empty or whitespace-only title
- **THEN** service SHALL throw validation error asynchronously

### Requirement: Task Update Service
The BLL SHALL provide async task update functionality with business rule enforcement.

#### Scenario: Update task title
- **WHEN** client provides new valid title
- **THEN** service updates task title and sets updatedAt timestamp asynchronously

#### Scenario: Update task to invalid state
- **WHEN** client attempts to set empty title
- **THEN** service SHALL throw validation error asynchronously

#### Scenario: Update task status
- **WHEN** client updates task status
- **THEN** service validates status transition is allowed and updates timestamp asynchronously

### Requirement: Task Status Transitions
The BLL SHALL enforce valid status transitions for tasks asynchronously.

#### Scenario: Start TODO task
- **WHEN** client calls startAsync() on a TODO task
- **THEN** task transitions to IN_PROGRESS status asynchronously

#### Scenario: Start non-TODO task
- **WHEN** client calls startAsync() on a task not in TODO status
- **THEN** no status change occurs

#### Scenario: Complete IN_PROGRESS task
- **WHEN** client calls completeAsync() on an IN_PROGRESS task
- **THEN** task transitions to DONE status asynchronously

#### Scenario: Complete non-IN_PROGRESS task
- **WHEN** client calls completeAsync() on a task not in IN_PROGRESS status
- **THEN** no status change occurs

#### Scenario: Cancel any task
- **WHEN** client calls cancelAsync() on any task
- **THEN** task transitions to CANCELLED status asynchronously regardless of current status

### Requirement: Task Tagging Operations
The BLL SHALL manage task tags with business rules asynchronously.

#### Scenario: Add valid tag
- **WHEN** client adds a non-empty tag not already present
- **THEN** tag is added to task's tags array asynchronously

#### Scenario: Add duplicate tag
- **WHEN** client adds a tag that already exists
- **THEN** no duplicate is added, tag list remains unchanged asynchronously

#### Scenario: Add empty tag
- **WHEN** client adds an empty or whitespace-only tag
- **THEN** tag is not added, no error thrown asynchronously

#### Scenario: Remove existing tag
- **WHEN** client removes a tag that exists
- **THEN** tag is removed from tags array asynchronously

#### Scenario: Remove non-existent tag
- **WHEN** client removes a tag that doesn't exist
- **THEN** no error thrown, tag list unchanged asynchronously

### Requirement: Task Priority Management
The BLL SHALL handle task priority changes asynchronously.

#### Scenario: Change task priority
- **WHEN** client updates task priority to valid value
- **THEN** priority is updated and timestamp set asynchronously

### Requirement: Task Query Service
The BLL SHALL provide async task querying capabilities through the service layer.

#### Scenario: Get tasks by status
- **WHEN** client requests tasks filtered by status
- **THEN** service returns all tasks matching the status asynchronously

#### Scenario: Get tasks by priority
- **WHEN** client requests tasks filtered by priority
- **THEN** service returns all tasks matching the priority asynchronously
