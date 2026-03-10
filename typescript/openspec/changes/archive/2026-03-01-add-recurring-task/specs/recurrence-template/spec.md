## ADDED Requirements

### Requirement: Create Recurrence Template
The system SHALL allow users to create named recurrence templates.

#### Scenario: Create simple template
- **WHEN** user creates a template with name "Every 3 days" and intervals `[{value: 3, unit: "days"}]`
- **THEN** the template SHALL be stored with a unique ID

#### Scenario: Create compound template
- **WHEN** user creates a template with name "3 months and 5 days" and intervals `[{value: 3, unit: "months"}, {value: 5, unit: "days"}]`
- **THEN** the template SHALL be stored with a unique ID

#### Scenario: Template with dayOfMonth for monthly pattern
- **WHEN** user creates a template with name "Monthly on 15th" and intervals `[{value: 1, unit: "months"}]` and dayOfMonth `15`
- **THEN** the template SHALL preserve the dayOfMonth value

### Requirement: Recurrence Template Validation
The system SHALL validate recurrence templates before saving.

#### Scenario: Valid template with positive intervals
- **WHEN** creating a template with valid intervals array where all values > 0
- **THEN** the template SHALL be accepted

#### Scenario: Invalid empty intervals array
- **WHEN** creating a template with intervals `[]`
- **THEN** the system SHALL reject with validation error

#### Scenario: Invalid zero value in interval
- **WHEN** creating a template with intervals `[{value: 0, unit: "days"}]`
- **THEN** the system SHALL reject with validation error

#### Scenario: Invalid negative value in interval
- **WHEN** creating a template with intervals `[{value: -1, unit: "days"}]`
- **THEN** the system SHALL reject with validation error

#### Scenario: Duplicate template name allowed
- **WHEN** creating a template with a name that already exists
- **THEN** the template SHALL be accepted (names don't need to be unique)

### Requirement: Default Templates
The system SHALL provide default recurrence templates.

#### Scenario: Default templates exist
- **WHEN** the application initializes
- **THEN** default templates SHALL exist: "Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Yearly"

#### Scenario: Default templates have correct intervals
- **GIVEN** default template "Daily"
- **WHEN** querying its intervals
- **THEN** the intervals SHALL be `[{value: 1, unit: "days"}]`

### Requirement: Task References Template
The system SHALL allow tasks to reference recurrence templates.

#### Scenario: Task with template reference
- **WHEN** a task is created with `recurrenceTemplateId` pointing to an existing template
- **THEN** the task SHALL be associated with that template

#### Scenario: Task without recurrence
- **WHEN** a task is created without `recurrenceTemplateId`
- **THEN** the task SHALL not be recurring

### Requirement: Template CRUD Operations
The system SHALL support creating, reading, updating, and deleting recurrence templates.

#### Scenario: Update template
- **GIVEN** an existing template
- **WHEN** updating its name or intervals
- **THEN** the changes SHALL be persisted

#### Scenario: Delete template
- **GIVEN** an existing template not used by any task
- **WHEN** deleting the template
- **THEN** the template SHALL be removed

#### Scenario: Delete template in use
- **GIVEN** a template that is referenced by one or more tasks
- **WHEN** attempting to delete the template
- **THEN** the system SHALL reject the deletion with error
