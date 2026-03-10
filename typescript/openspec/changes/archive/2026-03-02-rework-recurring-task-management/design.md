## Context

### Background
The current system has a `RecurrenceTemplate` entity that defines recurrence patterns (intervals, day of month, weekday), and tasks reference this via `recurrenceTemplateId`. However, this approach:
- Doesn't allow users to define date ranges (start/end or indefinite)
- Doesn't generate tasks in advance
- Doesn't support editing/stopping recurrence gracefully
- Doesn't track which tasks were generated from which recurring source

### Current State
- `IRecurrenceTemplate`: Still available for interval patterns
- `ITask`: No longer has recurrenceTemplateId (simpler)
- `RecurringTaskGenerator`: Replaced by new RecurringTaskService

### Constraints
- TypeScript codebase with clean code principles
- LocalStorage persistence (no backend database)
- Fresh development - no existing data to migrate
- All interfaces prefixed with `I`
- All enums prefixed with `E`

### Stakeholders
- Users who create recurring tasks
- Future admin panel (batch generation utility)

---

## Goals / Non-Goals

**Goals:**
1. Create separate `RecurringTask` entity combining task details + recurrence config
2. Support date range (startDate, endDate or indefinite)
3. Generate tasks up to 1 year ahead (or next task if interval > 1 year)
4. Track generated tasks via junction table with metadata
5. Handle sync when recurring task is modified (update, regenerate, delete)
6. Lock completed tasks so they cannot be modified/deleted
7. Provide batch generation utility for monthly execution

**Non-Goals:**
- UI implementation (future work)
- Complex recurrence patterns beyond intervals (keep using existing `IInterval`)
- Real-time synchronization or multi-user conflicts

---

## Decisions

### D1: New `RecurringTask` Entity (not reusing `RecurrenceTemplate`)

**Decision:** Create a new `RecurringTask` entity that combines task details with recurrence configuration.

**Rationale:**
- Current `RecurrenceTemplate` only stores recurrence patterns, not task details
- Users need to define task properties (title, description, priority) once for the recurring series
- Date range support requires a new structure

**Alternative Considered:**
- Extend existing `RecurrenceTemplate` to include task fields → Rejected because it mixes two concerns (pattern + task)

---

### D2: Junction Table for Task-Recurring Relationship

**Decision:** Use a junction table (`TaskRecurringLink`) to track the relationship with metadata.

**Rationale:**
- Allows tracking metadata: `originalGeneratedDate`, `lastRegeneratedDate`
- Future extensibility for more relationship metadata
- Clean separation between task instance and its recurring origin

**Alternative Considered:**
- Add `recurringTaskId` directly to Task → Rejected; less flexible for metadata

---

### D3: Advance Generation = 1 Year (or next task if interval > 1 year)

**Decision:** When a recurring task is created/edited, generate tasks up to 1 year ahead. If the interval exceeds 1 year, generate only until the next occurrence.

**Rationale:**
- Balances storage usage with user convenience
- Prevents infinite generation for very long intervals

---

### D4: Sync Strategy - Edit, Regenerate, Delete

**Decision:** When recurring task is modified:
- If only task properties changed → Update all non-done linked tasks
- If interval changed → Regenerate all future tasks (delete and recreate)
- If stopped → Delete all future (non-done) linked tasks
- Done tasks → Locked, never modified

**Rationale:**
- Preserves history of completed tasks
- Future tasks reflect new configuration
- Clear, predictable behavior

---

### D5: Batch Generation Utility as Standalone Function

**Decision:** Create a standalone `generateAllPendingTasks()` function that can be called from admin panel or scheduled monthly.

**Rationale:**
- Separates reactive generation (on create/edit) from proactive generation
- Allows manual/admin-triggered generation
- Simple to implement as utility function

---

## Risks / Trade-offs

### R1: Storage Usage
**[Risk]** Generating 1 year of tasks upfront could use significant LocalStorage.
**[Mitigation]** Limit to 1 year max; user can always create more manually.

### R2: Deleting Future Tasks
**[Risk]** Users might accidentally delete future generated tasks by stopping recurrence.
**[Mitigation]** Require confirmation in UI (future); currently only programmatic access.

### R3: Completed Task Locking
**[Risk]** Locked tasks cannot be corrected if there was a data error.
**[Mitigation]** Only lock tasks marked DONE; in-progress tasks can still be edited. Consider adding an "unlock" admin function later.

### R4: Fresh Start (No Migration Needed)
**[Risk]** N/A - This is new development with no existing data.
**[Mitigation]** N/A

---

## Migration Plan

1. **Phase 1**: Add new interfaces (`IRecurringTask`, `ITaskRecurringLink`)
2. **Phase 2**: Create new domain classes and repository
3. **Phase 3**: Update `RecurringTaskGenerator` to use new entities
4. **Phase 4**: Add sync logic (update, regenerate, delete)
5. **Phase 5**: Create batch generation utility
6. **Phase 6**: Update tests

**Rollback:** N/A - fresh development

---

## Open Questions

1. **Q1**: Should we keep backward compatibility with `recurrenceTemplateId` on tasks?
   - **Current thinking**: Yes, existing tasks work; new system is additive

2. **Q2**: How to handle task category assignment for generated tasks?
   - **Current thinking**: Carry over categories from recurring task to generated tasks

3. **Q3**: Should the junction table support multiple recurring sources per task?
   - **Current thinking**: No, one-to-many only for simplicity
