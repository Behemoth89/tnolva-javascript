## ADDED Requirements

### Requirement: Date Range Filter UI
The system SHALL provide date range filter controls with start date input, end date input, and a helper dropdown for quick presets.

#### Scenario: Date filter inputs available
- **WHEN** index page renders
- **THEN** system displays start date input, end date input, and a preset dropdown

#### Scenario: Select preset fills dates
- **WHEN** user selects a preset from the dropdown
- **THEN** system populates start and end date inputs with appropriate dates
- **AND** triggers filtering

#### Scenario: Available presets
- **WHEN** user opens preset dropdown
- **THEN** system displays options: Today, This week, Next week, This month, Next month, This year, Clear

### Requirement: Filter Tasks by Date Range
The system SHALL filter tasks where the task's date falls within the selected start and end dates (inclusive on both ends).

#### Scenario: Filter with both dates
- **WHEN** user enters start date and end date
- **THEN** system shows tasks where startDate >= filterStart AND dueDate <= filterEnd

#### Scenario: Filter with only start date
- **WHEN** user enters only start date
- **THEN** system shows tasks where startDate >= filterStart

#### Scenario: Filter with only end date
- **WHEN** user enters only end date
- **THEN** system shows tasks where dueDate <= filterEnd (or startDate if no dueDate)

#### Scenario: Clear dates resets filter
- **WHEN** user selects "Clear" or clears both date inputs
- **THEN** system removes date filter and shows all tasks

### Requirement: Date Range Preset Calculations
The system SHALL calculate preset date ranges correctly based on current date.

#### Scenario: Today preset
- **WHEN** user selects "Today"
- **THEN** start = today's date at 00:00 date at 23, end = today's:59

#### Scenario: This week preset
- **WHEN** user selects "This week"
- **THEN** start = Monday of current week, end = Sunday of current week

#### Scenario: Next week preset
- **WHEN** user selects "Next week"
- **THEN** start = Monday of next week, end = Sunday of next week

#### Scenario: This month preset
- **WHEN** user selects "This month"
- **THEN** start = 1st of current month, end = last day of current month

#### Scenario: Next month preset
- **WHEN** user selects "Next month"
- **THEN** start = 1st of next month, end = last day of next month

#### Scenario: This year preset
- **WHEN** user selects "This year"
- **THEN** start = January 1st of current year, end = December 31st of current year
