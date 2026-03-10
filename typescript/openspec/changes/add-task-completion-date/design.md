## Context

The task management system currently tracks task start dates and due dates but lacks a way to record when tasks were actually completed. This creates two problems:

1. **Missing completion tracking**: Users cannot see when tasks were completed - only that they are done.
2. **Broken date filtering**: The current date filter in `src/ui/pages/index.ts` uses a range comparison where `taskStart >= filterStart AND taskEnd <= filterEnd`. This doesn't work properly because:
   - It filters tasks whose start-end date range falls ENTIRELY within the filter range
   - For filtering 02.02.2026 to 03.02.2026, users want to see tasks that have either date in that range
   - The logic needs to check if ANY date in the task's range overlaps with the filter range

The change involves:
- Adding `completionDate` field to Task entity
- Updating all DTOs (IBllTaskDto, IBllTaskCreateDto, IBllTaskUpdateDto, ITaskCreateDto, ITaskUpdateDto)
- Modifying TaskService.completeAsync() to auto-set completionDate to current date
- Adding optional completionDate parameter to completeAsync() for manual override
- Fixing the date filtering logic in the UI

## Goals / Non-Goals

**Goals:**
- Add `completionDate` field to track when tasks are actually completed
- Auto-set completionDate to current date when marking task as DONE
- Allow manual completionDate override (for backdating)
- Fix date filtering to properly show tasks that overlap with the selected date range
- For DONE tasks, use completionDate as the end of the date range
- For non-DONE tasks, use dueDate (or 01.01.3000 if not set) as the end of the date range

**Non-Goals:**
- Modifying the recurrence task generation logic (keep existing behavior)
- Adding completion date to statistics calculations (out of scope)
- Historical completion date tracking beyond the current field

## Decisions

### 1. Data Model Addition
**Decision**: Add `completionDate?: Date` to ITaskEntity
**Rationale**: Follows existing pattern for optional date fields (like dueDate). Null until task is marked done.

### 2. DTO Updates
**Decision**: Add completionDate to all task DTOs:
- ITaskCreateDto
- ITaskUpdateDto  
- IBllTaskCreateDto
- IBllTaskUpdateDto
- IBllTaskDto

**Rationale**: All layers need to support the new field for creation, update, and display.

### 3. Auto-completion Behavior
**Decision**: When status is set to DONE (via update or completeAsync), automatically set completionDate to current date if not already set.

**Alternative considered**: Only set on completeAsync() - rejected because users can also mark done via status dropdown in edit modal.

### 4. Manual Override
**Decision**: Allow setting completionDate explicitly in IBllTaskUpdateDto and ITaskUpdateDto

**Rationale**: User requirement - users may need to backdate completions (e.g., marking done today tasks that were actually completed earlier).

### 5. Date Filtering Logic
**Decision**: Use overlap-based filtering instead of containment:
- A task is included if: `max(taskStart, filterStart) <= min(taskEnd, filterEnd)`
- For DONE tasks: taskEnd = completionDate
- For non-DONE tasks: taskEnd = dueDate || 01.01.3000 (hidden from user)

**Alternative considered**: Keep current logic and fix with different date selection - rejected because current logic is fundamentally wrong for the user's use case.

## Risks / Trade-offs

- **Risk**: Existing tasks don't have completionDate set
  - **Mitigation**: completionDate is optional, only set when task is marked done

- **Risk**: Date filter change may affect existing filtered views
  - **Mitigation**: The new behavior matches user expectations better (showing tasks that have any overlap with selected range)

- **Risk**: 01.01.3000 as placeholder may show unexpected results
  - **Mitigation**: This value is only used internally for comparison, never displayed to user
