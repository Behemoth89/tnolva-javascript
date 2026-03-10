## ADDED Requirements

### Requirement: Data table component
The UI SHALL provide a reusable data table component for displaying entity lists.

#### Scenario: Table displays data
- **WHEN** data is provided to the table component
- **THEN** it SHALL render rows for each item
- **AND** it SHALL display columns for relevant entity fields
- **AND** it SHALL provide action buttons for edit and delete

### Requirement: Form component
The UI SHALL provide a reusable form component for creating and editing entities.

#### Scenario: Form renders input fields
- **WHEN** the form component is initialized with entity schema
- **THEN** it SHALL render appropriate input fields for each property
- **AND** it SHALL support different input types (text, date, select, etc.)

### Requirement: Modal component
The UI SHALL provide a modal dialog component for confirmations and form overlays.

#### Scenario: Modal displays content
- **WHEN** the modal is opened with content
- **THEN** it SHALL display an overlay covering the screen
- **AND** it SHALL display the content in a centered dialog
- **AND** it SHALL provide close/cancel buttons

### Requirement: Form validation
The form component SHALL validate user input before submission.

#### Scenario: Form validates on submit
- **WHEN** the user submits the form
- **THEN** required fields SHALL be validated
- **AND** invalid fields SHALL show error messages

### Requirement: Delete confirmation
The UI SHALL prompt for confirmation before deleting entities.

#### Scenario: Delete shows confirmation
- **WHEN** the user clicks delete on an entity
- **THEN** a confirmation modal SHALL appear
- **AND** deletion SHALL only proceed after confirmation
