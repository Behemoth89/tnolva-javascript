## ADDED Requirements

### Requirement: Tasks Index Page Displays Task Table
The system SHALL display a table of all tasks on the index page (route `/`) with the following columns: status, title, category, description, tags, start date, due date, actions.

#### Scenario: Index page shows all tasks
- **WHEN** user navigates to `/`
- **THEN** system displays a table with all tasks loaded from TaskService

#### Scenario: Table displays all required columns
- **WHEN** index page renders
- **THEN** table MUST display columns: status, title, category, description, tags, start date, due date, actions

#### Scenario: Empty state when no tasks
- **WHEN** there are no tasks in the system
- **THEN** system displays a message indicating no tasks exist

### Requirement: Table Headers Are Sortable
The system SHALL allow users to sort the task table by clicking on column headers. Sorting SHALL toggle between ascending and descending order.

#### Scenario: Click header sorts column
- **WHEN** user clicks on a sortable column header
- **THEN** system sorts the table by that column in ascending order
- **AND** displays a sort indicator (arrow)

#### Scenario: Click same header toggles direction
- **WHEN** user clicks on a column that is already sorted
- **THEN** system toggles sort direction (ascending ↔ descending)

#### Scenario: Different column changes sort
- **WHEN** user clicks on a different column header while another is sorted
- **THEN** system sorts by the new column in ascending order

### Requirement: Table Columns Are Filterable
The system SHALL allow users to filter tasks by typing in filter inputs for each column.

#### Scenario: Type in column filter
- **WHEN** user types in a column's filter input
- **THEN** system filters the table to show only rows matching the search term in that column

#### Scenario: Multiple column filters combine
- **WHEN** user enters filters in multiple columns
- **THEN** system shows only rows matching ALL active filters (AND logic)

#### Scenario: Clear filter shows all
- **WHEN** user clears a filter input
- **THEN** system removes that filter and shows all rows matching other active filters
