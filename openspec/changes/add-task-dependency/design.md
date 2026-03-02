## Context

The Task Management Utility currently supports basic task CRUD operations with categories and recurring tasks. Users need to organize complex tasks into hierarchical structures where a main (parent) task depends on completion of smaller subtasks. This is a common pattern in project management where a large work item is broken down into smaller, manageable pieces.

### Current State
- Tasks have basic properties: id, title, description, status, priority, due dates, categories
- Recurring tasks use a junction table pattern (`TaskRecurringLink`) - we will follow the same pattern
- Repositories follow a standard pattern with localStorage persistence
- Unit of Work pattern is used for transaction management

### Constraints
- LocalStorage-based persistence (no SQL database)
- TypeScript with clean code principles
- All interfaces must be prefixed with `I`
- All enums must be prefixed with `E`

### Stakeholders
- End users managing project tasks
- Development team implementing the feature

## Goals / Non-Goals

**Goals:**
- Implement task dependency system using junction table pattern
- Support parent-child task relationships (main task ↔ subtasks) - **v1: single level only**
- Prevent direct circular references in dependency chains
- Enforce status constraint: main task cannot be marked done until all subtasks are done
- Add due date validation with warning and auto-correction option
- Follow existing project patterns (TaskRecurringLink style)

**Non-Goals:**
- Multi-level hierarchy (subtasks having subtasks) - **v1 constraint**
- Complex dependency graphs - one level only
- Dependency types beyond "subtask" - keeping it simple
- Backward compatibility with existing data - this is a new feature
- Multiple parents for a single task - one parent only
- Bulk dependency operations - individual add/remove

## Decisions

### 1. Junction Table Pattern
**Decision:** Use junction table pattern similar to `TaskRecurringLink`

**Rationale:** 
- Already proven pattern in the codebase
- Follows project style conventions
- Allows many-to-many relationships between tasks
- Easy to query both directions (what tasks depend on X, what tasks does X depend on)

**Alternative considered:** Adjacency list (parent_id on Task) - Rejected because:
- Only supports single-level hierarchy
- Harder to query "all descendants" efficiently
- Less flexible for future enhancements

### 2. Dependency Storage Structure
**Decision:** Store dependency_type enum to allow future extensibility

**Columns:**
- `id`: string (GUID)
- `task_id`: string (the dependent/child task)
- `depends_on_task_id`: string (the parent/main task)
- `dependency_type`: enum (SUBTASK = "subtask")
- `created_at`: timestamp
- `updated_at`: timestamp

**Rationale:** Prevents circular references at storage level, enables future dependency types without schema changes.

### 3. Circular Reference Detection (v1: Direct Check Only)
**Decision:** Simple direct check - no transitive DFS needed for single-level hierarchy

**Algorithm:**
1. Before adding dependency (A depends on B), check if B already depends on A (direct)
2. Also check if A already has a parent (v1: one parent only)
3. No need for graph traversal since we only support one level

**Rationale:** 
- With single-level hierarchy, we only need to check:
  - Does target already depend on source? (direct cycle)
  - Does source already have a parent? (multi-level prevention)
- This is O(1) instead of O(n) DFS
- Simpler to implement and test

### 4. Status Enforcement Logic
**Decision:** Check at update time, not at completion time

**Flow:**
1. When user attempts to set main task status to DONE
2. Query all subtasks (tasks that depend on main task)
3. If any subtask status != DONE, throw validation error
4. Allow status change only if all subtasks are DONE

**Rationale:** 
- Fails fast at update time
- Clear error message to user
- Follows "fail early" principle

### 5. Due Date Warning Approach
**Decision:** Two options - warn and let user choose, or auto-correct

**Implementation:**
1. When subtask due date > main task due date
2. Show warning to user with two options:
   - Change subtask due date to match main task
   - Automatically extend main task due date to match subtask
3. User makes the choice, system executes

**Rationale:** Gives user control while providing convenience option for auto-correction.

### 6. Subtask Template for Recurring Tasks
**Decision:** Extend recurring task templates to include optional subtask templates, using startDate for date calculation

**Implementation:**
1. Add `startDate` field to Task (required, defaults to creation timestamp)
2. Extend `RecurrenceTemplate` to have `subtaskTemplates: SubtaskTemplate[]`
3. Each `SubtaskTemplate` contains:
   - `title`: string
   - `description`: string (optional)
   - `priority`: EPriority (optional, defaults to parent)
   - `startDateOffset`: number (days relative to parent start date)
   - `duration`: number (days, optional - if set, dueDate = startDate + duration)
4. When generating a recurring instance:
   - Create main task with startDate and dueDate (as before)
   - For each subtask template, calculate:
     - subtask.startDate = mainTask.startDate + offset
     - subtask.dueDate = subtask.startDate + duration (or use default)
   - Create TaskDependency linking subtask to main task
5. Generated subtasks bypass due date warning (dates are calculated from startDate, guaranteed ≤ parent dueDate)

**Example:**
```
RecurringTemplate:
  Main: "Sprint" (start: Monday, due: Friday)
  Subtasks:
    - "Plan" (startOffset: 0, duration: 2) → start Monday, due Wednesday
    - "Develop" (startOffset: 2, duration: 3) → start Wednesday, due Friday  
    - "Review" (startOffset: 4, duration: 1) → start Friday, due Saturday
```

**Rationale:**
- Using startDate ensures subtask dates are always ≤ parent dueDate
- No conflicts with due date validation
- Natural project planning: main task has a start date, subtasks begin relative to that
- Users can set duration for each subtask

### 6. Repository Layer
**Decision:** Create dedicated `TaskDependencyRepository` following existing repository patterns

**Methods:**
- `addDependency(taskId: string, dependsOnTaskId: string, type: EDependencyType): TaskDependency`
- `removeDependency(id: string): void`
- `getDependenciesForTask(taskId: string): TaskDependency[]`
- `getDependents(taskId: string): TaskDependency[]` (tasks that depend on this task)
- `hasDependency(taskId: string, dependsOnTaskId: string): boolean`

**Rationale:** Clean separation of concerns, follows Single Responsibility Principle, easy to test.

## Risks / Trade-offs

### [Risk] Deep dependency chains could cause performance issues
**Mitigation:** 
- **N/A for v1** - single-level hierarchy means no chains
- v1 is intentionally limited to prevent this issue

### [Risk] Due date auto-correction could cause unexpected date changes
**Mitigation:** 
- Always warn user first before auto-correcting
- Log all auto-corrections for audit
- Provide undo capability through normal date editing

### [Risk] Circular reference could lock the application
**Mitigation:** (v1 simplified)
- Simple direct check before saving any dependency: O(1)
- Also check if source already has a parent
- Return clear error message if validation fails

### [Risk] Deleting a task with dependencies could leave orphaned records
**Mitigation:**
- Add cascade delete in repository
- When deleting a task, also delete all its dependency records (as both task_id and depends_on_task_id)
- This should be handled in the TaskService delete method

### [Trade-off] Simplicity vs Flexibility
**Trade-off:** Supporting only "subtask" dependency type is simple but limits future use cases
**Resolution:** Start simple, the enum-based design allows easy addition of new types later (e.g., "blocks", "relates_to", "duplicates")

## Migration Plan

Since this is a new feature (no backward compatibility required):

1. Create new `TaskDependency` domain model
2. Create `ITaskDependency` interface
3. Create `ITaskDependencyRepository` interface  
4. Create `TaskDependencyRepository` implementation
5. Create `EDependencyType` enum
6. Add dependency methods to `Task` domain entity
7. Add dependency methods to `TaskService`
8. Update `UnitOfWork` to include `TaskDependencyRepository`
9. Write unit tests for new functionality

**No migration needed** - new feature with no existing data to migrate.

## Open Questions

1. ~~Should subtasks inherit categories from parent?~~ - Not in scope for v1, can be added later
2. ~~Should completing all subtasks automatically complete parent?~~ - No, explicit action required by user
3. ~~Should we support "optional" subtasks?~~ - Not in scope for v1, can be added later with new dependency type
4. **RESOLVED:** v1 supports exactly 1 level (parent → direct subtasks only)
