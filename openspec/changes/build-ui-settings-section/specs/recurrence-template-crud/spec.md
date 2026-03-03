## ADDED Requirements

### Requirement: List recurrence templates
The user SHALL be able to view all recurrence templates in a table format.

#### Scenario: Templates displayed in table
- **WHEN** the user navigates to the Recurrence Templates CRUD page
- **THEN** all templates SHALL be displayed in a table
- **AND** each row SHALL show: name, intervals (e.g., "Every 2 weeks"), day of month, weekday, duration
- **AND** action buttons for edit and delete SHALL be available

### Requirement: Create recurrence template
The user SHALL be able to create a new recurrence template.

#### Scenario: Create template form
- **WHEN** the user clicks "Add Template" button
- **THEN** a form SHALL appear with fields for: name, interval value, interval unit (days/weeks/months/years), day of month, weekday, duration

#### Scenario: Save new template
- **WHEN** the user fills in required fields and clicks Save
- **THEN** the template SHALL be created in storage
- **AND** the table SHALL update to show the new template

### Requirement: Edit recurrence template
The user SHALL be able to edit an existing recurrence template.

#### Scenario: Edit template form
- **WHEN** the user clicks Edit on a template row
- **THEN** a form SHALL appear pre-populated with the template's current values
- **AND** all fields SHALL be editable

#### Scenario: Save edited template
- **WHEN** the user modifies fields and clicks Save
- **THEN** the template SHALL be updated in storage
- **AND** the table SHALL reflect the changes

### Requirement: Delete recurrence template
The user SHALL be able to delete a recurrence template.

#### Scenario: Delete template with confirmation
- **WHEN** the user clicks Delete on a template
- **THEN** a confirmation modal SHALL appear asking "Are you sure you want to delete this template?"
- **AND** confirming SHALL remove the template from storage
- **AND** the table SHALL update to remove the template
