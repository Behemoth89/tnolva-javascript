## Context

The Task Management Utility currently supports basic task CRUD operations with status, priority, due dates, and tags. There is no mechanism for tasks to automatically repeat. Users manually create new tasks for recurring activities.

This design addresses the addition of recurring task functionality where:
- Smallest recurrence unit is one day (no time-based scheduling)
- Users can create named recurrence templates (e.g., "Daily", "Every 2 weeks", "Monthly on 15th", "3 months + 5 days")
- Templates stored separately, tasks reference them by ID
- Default templates pre-populated for common patterns
- Interval components: value (number) + unit (days|weeks|months|years)
- New task instances are generated automatically based on the template
- Existing task data is preserved (completed instances remain as history)

## Goals / Non-Goals

**Goals:**
- Enable tasks to reference named recurrence templates
- Users can create, edit, delete custom templates
- Calculate next occurrence dates by applying template intervals
- Support any combination of intervals (days, weeks, months, years)
- Keep smallest unit as one day (no time-of-day consideration)
- Pre-populated default templates for common patterns

**Non-Goals:**
- Time-based scheduling (hour/minute precision)
- Calendar integration (Google Calendar, Outlook, etc.)
- Recurrence exceptions/modifications after creation
- Automatic background processing (this is a client-side app, generation happens on task completion or manually triggered)
- Recurrence templates (master recurring tasks separate from instances)

## Decisions

### 1. Recurrence Template Storage
**Decision**: Store recurrence templates as separate entities, tasks reference template by ID.

**Data Model**:
```typescript
interface IInterval {
  value: number;      // e.g., 3
  unit: 'days' | 'weeks' | 'months' | 'years';
}

interface IRecurrenceTemplate {
  id: string;
  name: string;       // User-friendly name: "Every 2 weeks", "Monthly on 15th", "First Monday of month"
  intervals: IInterval[];  // [{value: 2, unit: "weeks"}] or [{value: 3, unit: "months"}, {value: 5, unit: "days"}]
  dayOfMonth?: number;     // Optional: for monthly patterns (1-31)
  weekday?: number;        // Optional: for weekly patterns (0-6, Sunday-Saturday)
  occurrenceInMonth?: number;  // Optional: 1-5 for nth occurrence, -1 for last (e.g., "First Monday" = 1, "Last Friday" = -1)
}
```

**Task references template**:
```typescript
interface ITask {
  // ... existing fields
  recurrenceTemplateId?: string;  // Reference to IRecurrenceTemplate
}
```

**Rationale**:
- Users can create custom-named patterns for reuse
- Easy to modify templates (changes reflect on all tasks using it)
- Simple serialization to localStorage

### 2. Default Templates
**Decision**: Pre-populate system with common recurrence templates.

**Default Templates**:
- "Daily" → [{value: 1, unit: "days"}]
- "Weekly" → [{value: 1, unit: "weeks"}]
- "Bi-weekly" → [{value: 2, unit: "weeks"}]
- "Monthly" → [{value: 1, unit: "months"}]
- "Quarterly" → [{value: 3, unit: "months"}]
- "Yearly" → [{value: 1, unit: "years"}]

**Default Weekday-Based Templates**:
- "First Monday of month" → occurrenceInMonth=1, weekday=1, intervals=[{value: 1, unit: "months"}]
- "Last Friday of month" → occurrenceInMonth=-1, weekday=5, intervals=[{value: 1, unit: "months"}]

Users can modify or delete these, and create their own.

### 3. Recurrence Calculation Strategy
**Decision**: Pure date arithmetic in TypeScript, no external date libraries

**Rationale**:
- Project has no external dependencies currently
- Date arithmetic is straightforward for day-based calculations
- Avoids bundle size increase

**Alternatives Considered**:
- rrule.js library → Heavy dependency for simple day-based recurrence
- date-fns → Adds ~70KB, not needed for day-precision only

### 4. Handling Monthly/Yearly Edge Cases
**Decision**: For months: use same day number or last day of month if invalid (e.g., Feb 30 → Feb 28/29). For years: use same month/day.

**Rationale**:
- Matches Google Calendar behavior
- Prevents invalid dates
- Predictable user experience

### 5. Interval Calculation (applies to any template)
**Decision**: Any combination of intervals is processed by applying each component sequentially.

**Algorithm**:
1. Start with the current/base date
2. For each interval component (in order):
   - If unit is 'days'/'weeks': add the value directly to the date
   - If unit is 'months': add months using the same day-clamping logic
   - If unit is 'years': add years with month/day preservation
3. Return the final date after all components applied

**Example**:
- Template: "3 months and 5 days"
- Intervals: [{value: 3, unit: "months"}, {value: 5, unit: "days"}]
- Base: 2026-01-15
- Step 1: Add 3 months → 2026-04-15
- Step 2: Add 5 days → 2026-04-20
- Result: 2026-04-20

### 6. Template CRUD Operations

### 7. Handling Weekday-Based Recurrence (occurrenceInMonth)
**Decision**: Support patterns like "First Monday of month" using `occurrenceInMonth` and `weekday` fields.

**occurrenceInMonth values**:
- 1 = First occurrence of weekday in month
- 2 = Second occurrence of weekday in month
- 3 = Third occurrence of weekday in month
- 4 = Fourth occurrence of weekday in month
- 5 = Fifth occurrence (if exists)
- -1 = Last occurrence of weekday in month

**Algorithm for weekday-based calculation**:
1. Move to target month
2. Find all days matching the weekday in that month
3. If occurrenceInMonth is positive: select the nth day
4. If occurrenceInMonth is -1: select the last matching day

**Examples**:
- "First Monday of month": weekday=1, occurrenceInMonth=1, intervals=[{value: 1, unit: "months"}]
- "Last Friday of month": weekday=5, occurrenceInMonth=-1, intervals=[{value: 1, unit: "months"}]
- "Second Tuesday of month": weekday=2, occurrenceInMonth=2, intervals=[{value: 1, unit: "months"}]

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Monthly on 31st** (e.g., "every month on 31st" in February) | Use last day of month for months without that day number |
| **Custom interval overflow** (e.g., "every 0 days") | Validate minimum interval of 1 day |
| **Infinite recurrence loops** | No artificial limit; user can delete recurring tasks |
| **Performance with many recurring tasks** | Calculate on-demand (task completion), not background |
| **Lost recurrence on task update** | Recurrence field is preserved on task updates |
| **Completed instances cluttering storage** | Users can archive/delete completed instances manually |

## Migration Plan

1. **Phase 1 - Data Model** (Day 1)
   - Add `IInterval` interface
   - Add `IRecurrenceTemplate` interface
   - Add `RecurrenceTemplate` entity
   - Add `recurrenceTemplateId` field to `ITask` interface
   - Add `recurrenceTemplateId` field to `Task` entity
   - Add `RecurrenceTemplateRepository` for CRUD operations

2. **Phase 2 - Core Logic** (Day 2)
   - Implement `RecurrenceCalculator` class
   - Implement `calculateNextOccurrence()` method using intervals
   - Add unit tests for recurrence calculations

3. **Phase 3 - Template Management** (Day 3)
   - Implement default templates initialization
   - Add template CRUD operations
   - Add template selection UI/API

4. **Phase 4 - Task Generation** (Day 4)
   - Implement `RecurringTaskGenerator` service
   - Modify task completion logic to generate next instance
   - Add integration tests

5. **Phase 5 - Validation & Polish** (Day 5)
   - Add recurrence validation
   - Handle edge cases
   - Update documentation

**Rollback Strategy**: Since this is additive, rollback simply means not using the new feature. No migration scripts needed.

## Open Questions

1. **Should recurring tasks create new instances automatically or require manual trigger?**
   - Current design: Generate on task completion (manual trigger)
   - Alternative: Background timer (complex for client-side only)

2. **How to handle recurring task deletion?**
   - Option A: Delete all instances (including history)
   - Option B: Keep completed instances, delete only future
   - Recommendation: Option A for simplicity

3. **Should we store recurrence history (all generated instances)?**
   - Recommendation: No, generate on-demand. Store only the template task.
