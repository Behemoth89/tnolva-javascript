## ADDED Requirements

### Requirement: Add Task Button
The system SHALL display an "Add Task" button on the index page that opens a modal form.

#### Scenario: Button opens modal
- **WHEN** user clicks "Add Task" button
- **THEN** system opens a modal with the task creation form

### Requirement: Task Creation Form Fields
The system SHALL provide a form with fields for: title, description, status, priority, category, tags, start date, due date, dependencies.

#### Scenario: Form displays all fields
- **WHEN** add task modal opens
- **THEN** system displays fields for: title, description, status, priority, category, tags, start date, due date, dependencies

#### Scenario: Title is required
- **WHEN** user submits form without title
- **THEN** system displays validation error "Title is required"

### Requirement: Category Dropdown Is Filterable
The system SHALL provide a searchable dropdown for selecting a category.

#### Scenario: Category dropdown searchable
- **WHEN** user types in category dropdown search
- **THEN** system filters dropdown options to match search term

#### Scenario: Category dropdown shows all on focus
- **WHEN** user clicks on category dropdown
- **THEN** system shows all available categories

### Requirement: Dependency Dropdown Is Filterable
The system SHALL provide a searchable dropdown for selecting task dependencies (other tasks).

#### Scenario: Dependency dropdown searchable
- **WHEN** user types in dependency dropdown search
- **THEN** system filters dropdown options to match search term

#### Scenario: Shows only active tasks as dependencies
- **WHEN** user opens dependency dropdown
- **THEN** system shows only tasks with status TODO or IN_PROGRESS

### Requirement: Submit Creates Task
The system SHALL create a new task when form is submitted with valid data.

#### Scenario: Valid form submits successfully
- **WHEN** user fills required fields and submits
- **THEN** system creates task via TaskService
- **AND** closes modal
- **AND** refreshes task table

#### Scenario: Duplicate dependency shows error
- **WHEN** user tries to add a task as its own dependency
- **THEN** system displays error "A task cannot depend on itself"
