## ADDED Requirements

### Requirement: Recurrence Template Management
The BLL SHALL manage async recurrence templates for recurring tasks.

#### Scenario: Get default recurrence templates
- **WHEN** service initializes
- **THEN** default recurrence templates SHALL be loaded asynchronously

#### Scenario: Get next occurrence date
- **WHEN** client requests next occurrence for a template and start date
- **THEN** service calculates and returns asynchronously the next valid date based on recurrence rules

#### Scenario: Calculate next occurrence for daily recurrence
- **WHEN** template has daily interval
- **THEN** next occurrence is start date + 1 day asynchronously

#### Scenario: Calculate next occurrence for weekly recurrence
- **WHEN** template has weekly interval with specific days
- **THEN** next occurrence is the next matching day of the week asynchronously

#### Scenario: Calculate next occurrence for monthly recurrence
- **WHEN** template has monthly interval with day of month
- **THEN** next occurrence advances by one month asynchronously, handling month-end edge cases

### Requirement: Recurring Task Generation
The BLL SHALL generate async new tasks from recurring templates when parent task is completed.

#### Scenario: Generate next task on completion
- **WHEN** client completes a task with recurrence template
- **THEN** service generates a new task asynchronously with adjusted due date based on template

#### Scenario: No recurrence template
- **WHEN** client completes task without recurrence template
- **THEN** service returns null asynchronously, no new task generated

#### Scenario: Task with daily recurrence
- **WHEN** task with daily template is completed
- **THEN** new task is created asynchronously with same properties and due date + 1 day

#### Scenario: Task with weekly recurrence
- **WHEN** task with weekly template is completed
- **THEN** new task is created asynchronously with same properties and due date + 7 days

### Requirement: Recurrence Validation
The BLL SHALL validate async recurrence template configurations.

#### Scenario: Invalid interval
- **WHEN** template has zero or negative interval
- **THEN** service SHALL throw validation error asynchronously

#### Scenario: Monthly recurrence on 31st
- **WHEN** template has monthly recurrence and day 31
- **THEN** service handles month-end asynchronously by using last day of month

### Requirement: Recurrence Service Integration
The BLL SHALL integrate async with task and category services for complete recurring task workflow.

#### Scenario: Complete recurring task with category
- **WHEN** client completes task that has both recurrence template and category assignments
- **THEN** new task inherits category assignments asynchronously from parent task
