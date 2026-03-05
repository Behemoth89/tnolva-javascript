## ADDED Requirements

### Requirement: Date range filtering by completion date for done tasks
The system SHALL filter tasks based on their completion date when the task status is DONE.

#### Scenario: Filter done tasks by completion date range
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has status DONE with completionDate 02.02.2026
- **THEN** the task is included in the filtered results

#### Scenario: Filter done tasks by completion date range - end date
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has status DONE with completionDate 03.02.2026
- **THEN** the task is included in the filtered results

#### Scenario: Filter done tasks by completion date - outside range
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has status DONE with completionDate 04.02.2026
- **THEN** the task is excluded from the filtered results

### Requirement: Date range filtering by due date for non-done tasks
The system SHALL filter non-DONE tasks based on their due date (or 01.01.3000 if no due date is set).

#### Scenario: Filter non-done tasks by due date range
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has status TODO with dueDate 02.02.2026
- **THEN** the task is included in the filtered results

#### Scenario: Filter non-done tasks with no due date
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has status TODO with no dueDate
- **THEN** the task is evaluated using 01.01.3000 as the end date (internal only, not displayed to user)

#### Scenario: Filter non-done tasks by due date - outside range
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has status TODO with dueDate 04.02.2026
- **THEN** the task is excluded from the filtered results

### Requirement: Date range overlap filtering
The system SHALL use overlap-based filtering where a task is included if any part of its date range overlaps with the selected filter range.

#### Scenario: Task start date in range
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has startDate 02.02.2026 and dueDate 05.02.2026
- **THEN** the task is included because startDate falls within the filter range

#### Scenario: Task end date in range
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has startDate 30.01.2026 and dueDate 03.02.2026
- **THEN** the task is included because dueDate falls within the filter range

#### Scenario: Task range encompasses filter range
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has startDate 01.02.2026 and dueDate 10.02.2026
- **THEN** the task is included because the ranges overlap

#### Scenario: Task range outside filter range
- **WHEN** filtering tasks with date range 02.02.2026 to 03.02.2026 and task has startDate 05.02.2026 and dueDate 10.02.2026
- **THEN** the task is excluded because there is no overlap
