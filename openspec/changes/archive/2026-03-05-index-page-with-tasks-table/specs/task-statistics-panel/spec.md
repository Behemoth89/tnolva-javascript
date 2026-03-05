## ADDED Requirements

### Requirement: Display Filtered Task Count
The system SHALL display the count of tasks currently visible after applying all filters.

#### Scenario: Shows filtered count
- **WHEN** filters are applied to the task list
- **THEN** system displays a count of tasks matching current filters

#### Scenario: Updates with filters
- **WHEN** user changes any filter (column, date range, search)
- **THEN** system updates the displayed count to reflect filtered results

### Requirement: Display High Priority Task Count
The system SHALL display the count of high priority tasks within the filtered results.

#### Scenario: Shows high priority filtered count
- **WHEN** tasks are filtered
- **THEN** system displays count of tasks with EPriority.HIGH within filtered results

#### Scenario: Updates when priority changes
- **WHEN** a task's priority changes
- **THEN** system updates the high priority count accordingly
