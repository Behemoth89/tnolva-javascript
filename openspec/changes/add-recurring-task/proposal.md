## Why

Users need the ability to create tasks that automatically repeat based on defined recurrence patterns. Currently, users must manually create new tasks each time a recurring activity needs to be tracked. This creates friction for managing ongoing responsibilities like daily standups, weekly reports, monthly reviews, or any custom periodic task.

## What Changes

- **Recurrence Templates**: Users can create named recurrence patterns (templates) for reuse
  - Examples: "Daily", "Every 2 weeks", "Monthly on 15th", "3 months + 5 days"
  - Templates stored separately, referenced by task
- **Template Storage**: RecurrenceTemplate entity with id, name, intervals array
- **Task References Template**: Tasks store templateId instead of inline pattern
- **Interval Components**: Each component has value (number) and unit (days|weeks|months|years)
- **Recurrence Engine**: Calculate next occurrence by applying intervals sequentially
- **Default Templates**: Pre-populated templates for common patterns (daily, weekly, monthly, yearly)

### Breaking Changes
- None - this is an additive feature that doesn't modify existing behavior

## Capabilities

### New Capabilities
- `task-recurrence-template`: Named recurrence patterns users can create, save, and reuse (e.g., "Every 2 weeks", "Monthly on 15th")
- `recurrence-date-calculator`: Logic to compute next occurrence dates based on template intervals
- `recurring-task-generator`: Service to generate new task instances from a recurring task template

### Modified Capabilities
- `task-domain`: Extended to include recurrence field in Task entity and ITask interface
- `task-repository`: May need updates to support querying recurring task templates vs instances

## Impact

- **Affected Files**:
  - `src/domain/Task.ts` - Add recurrenceTemplateId field
  - `src/interfaces/ITask.ts` - Add recurrenceTemplateId property
  - New: `src/interfaces/IRecurrenceTemplate.ts`
  - New: `src/interfaces/IInterval.ts` (value, unit)
  - New: `src/domain/RecurrenceTemplate.ts`
  - New: `src/services/RecurrenceCalculator.ts`
  - New: `src/data/repositories/RecurrenceTemplateRepository.ts`
- **No new dependencies** - Pure TypeScript implementation
- **No breaking API changes** - All changes are additive
