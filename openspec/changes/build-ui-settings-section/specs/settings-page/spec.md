## ADDED Requirements

### Requirement: Settings page layout
The Settings page SHALL have a two-column layout with navigation sidebar and content area.

#### Scenario: Settings page loads
- **WHEN** the user navigates to the Settings page
- **THEN** a sidebar with navigation options SHALL be displayed on the left
- **AND** a content area SHALL be displayed on the right

### Requirement: Navigation sidebar
The Settings page SHALL provide navigation between different entity management sections.

#### Scenario: Sidebar displays entity types
- **WHEN** the Settings page is displayed
- **THEN** the sidebar SHALL show links for: Tasks, Categories, Recurrence Templates, Recurring Tasks, Task Dependencies

### Requirement: Content area
The content area SHALL display the currently selected entity management page.

#### Scenario: Content changes on navigation
- **WHEN** the user clicks a navigation item
- **THEN** the content area SHALL update to show the corresponding CRUD page

### Requirement: Active state indication
The navigation SHALL indicate which section is currently active.

#### Scenario: Active navigation item
- **WHEN** a navigation item is selected
- **THEN** that item SHALL have a visual indication (e.g., different background color)
