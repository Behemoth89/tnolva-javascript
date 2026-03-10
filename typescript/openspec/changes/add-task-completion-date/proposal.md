## Why

Currently, the task management system lacks a way to track when tasks were actually completed. This makes it impossible to accurately filter completed tasks by their completion date. Users need the ability to see tasks that were completed on specific dates, and optionally backdate completions for tasks that were done in the past but not recorded at that time.

## What Changes

- Add `completionDate` field to Task entity (optional, nullable)
- Default behavior: when task status changes to DONE, automatically set `completionDate` to current date
- Allow manual override: users can set a custom `completionDate` when marking a task complete
- Fix date range filtering logic:
  - For DONE tasks: evaluate date range from `startDate` to `completionDate`
  - For non-DONE tasks: evaluate date range from `startDate` to `dueDate` (or `01.01.3000` if no due date is set, but don't display this to the user)
- Update all repositories and DTOs to include the new field

## Capabilities

### New Capabilities
- `task-completion-date`: Track completion date on tasks with automatic and manual assignment
- `task-completion-filtering`: Enhanced date filtering that considers completion date for done tasks

### Modified Capabilities
- `task-entity`: Add completionDate field to the task entity
- `task-repository`: Update repository to handle completion date queries
- `task-dto`: Include completion date in data transfer objects

## Impact

- **Task Entity**: New `completionDate` field
- **Task DTOs**: Add completionDate to all task DTOs
- **Task Repository**: Update filtering logic for date range queries
- **Task Service**: Handle automatic completion date assignment and allow manual override
- **UI**: Update date filtering logic in task view to properly evaluate ranges
