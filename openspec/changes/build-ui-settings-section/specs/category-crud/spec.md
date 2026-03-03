## ADDED Requirements

### Requirement: List categories
The user SHALL be able to view all categories in a table format.

#### Scenario: Categories displayed in table
- **WHEN** the user navigates to the Categories CRUD page
- **THEN** all categories SHALL be displayed in a table
- **AND** each row SHALL show: name, description, color (as visual swatch), created date
- **AND** action buttons for edit and delete SHALL be available

### Requirement: Create category
The user SHALL be able to create a new category.

#### Scenario: Create category form
- **WHEN** the user clicks "Add Category" button
- **THEN** a form SHALL appear with fields for: name, description, color (hex code)
- **AND** color input SHALL show a color picker

#### Scenario: Save new category
- **WHEN** the user fills in required fields and clicks Save
- **THEN** the category SHALL be created in storage
- **AND** the table SHALL update to show the new category

### Requirement: Edit category
The user SHALL be able to edit an existing category.

#### Scenario: Edit category form
- **WHEN** the user clicks Edit on a category row
- **THEN** a form SHALL appear pre-populated with the category's current values
- **AND** all fields SHALL be editable

#### Scenario: Save edited category
- **WHEN** the user modifies fields and clicks Save
- **THEN** the category SHALL be updated in storage
- **AND** the table SHALL reflect the changes

### Requirement: Delete category
The user SHALL be able to delete a category.

#### Scenario: Delete category with confirmation
- **WHEN** the user clicks Delete on a category
- **THEN** a confirmation modal SHALL appear asking "Are you sure you want to delete this category?"
- **AND** confirming SHALL remove the category from storage
- **AND** the table SHALL update to remove the category
