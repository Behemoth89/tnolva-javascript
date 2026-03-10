## ADDED Requirements

### Requirement: Sidebar Visible on All Pages
The system SHALL display a sidebar navigation on all pages of the application.

#### Scenario: Sidebar shows on index page
- **WHEN** user navigates to index page (/)
- **THEN** system displays sidebar on the left side

#### Scenario: Sidebar shows on settings pages
- **WHEN** user navigates to any settings page
- **THEN** system displays sidebar on the left side

### Requirement: Sidebar Contains Navigation Links
The system SHALL display navigation links in the sidebar: Tasks (Home), Categories, Templates, Recurring Tasks, Dependencies.

#### Scenario: Sidebar displays all links
- **WHEN** sidebar renders
- **THEN** system displays: Tasks (Home), Categories, Templates, Recurring Tasks, Dependencies

#### Scenario: Tasks link points to index
- **WHEN** user clicks Tasks (Home) link
- **THEN** system navigates to index page (/)

### Requirement: Sidebar Is Collapsible
The system SHALL provide a toggle button to collapse and expand the sidebar.

#### Scenario: Toggle button visible
- **WHEN** sidebar renders
- **THEN** system displays a toggle button to collapse/expand

#### Scenario: Click collapses sidebar
- **WHEN** user clicks collapse button
- **THEN** system hides sidebar content
- **AND** shows collapsed state indicator

#### Scenario: Click expands sidebar
- **WHEN** sidebar is collapsed and user clicks expand button
- **THEN** system shows full sidebar

#### Scenario: Sidebar state persists
- **WHEN** sidebar is collapsed and user navigates to another page
- **THEN** system keeps sidebar collapsed on new page
