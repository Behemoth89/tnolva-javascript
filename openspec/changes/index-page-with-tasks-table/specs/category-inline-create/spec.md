## ADDED Requirements

### Requirement: Add New Category Button
The system SHALL display an "Add New Category" button next to the category dropdown in the task add modal.

#### Scenario: Button visible in modal
- **WHEN** task add modal is open
- **THEN** system displays "Add New Category" button next to category dropdown

#### Scenario: Click opens category creation
- **WHEN** user clicks "Add New Category"
- **THEN** system opens a small dialog/modal for category creation

### Requirement: Quick Category Creation
The system SHALL allow users to create a new category from within the task add modal without leaving the form.

#### Scenario: Create category with name and color
- **WHEN** user enters category name and selects color, then clicks Create
- **THEN** system creates new category via CategoryService
- **AND** selects the new category in the dropdown
- **AND** closes the category creation dialog

#### Scenario: New category appears in dropdown
- **WHEN** category is created successfully
- **THEN** system adds new category to category dropdown
- **AND** auto-selects the newly created category

#### Scenario: Cancel category creation
- **WHEN** user clicks Cancel in category creation dialog
- **THEN** system closes dialog without creating category
- **AND** returns focus to task add modal
