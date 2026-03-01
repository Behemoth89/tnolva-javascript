## MODIFIED Requirements

### Requirement: Simplified Task Entity
The Task entity SHALL be simplified to remove recurrence-specific fields. All tasks are now simple task instances regardless of whether they were generated from a recurring task.

#### Scenario: Task without recurrence fields
- **WHEN** a new task is created manually
- **THEN** it does NOT have recurrenceTemplateId field
- **AND** it is a plain task instance

#### Scenario: Task from recurring (via junction)
- **WHEN** a task is generated from a recurring task
- **THEN** it does NOT have recurrenceTemplateId field
- **AND** the relationship is tracked via junction table instead

**Migration**: New system - no migration needed.

---

### Requirement: Task Done Lock
Tasks marked as DONE SHALL be locked and cannot be modified or deleted.

#### Scenario: Prevent edit on done task
- **WHEN** user attempts to edit a task with status DONE
- **THEN** the edit is rejected with error "Cannot modify completed task"

#### Scenario: Prevent delete on done task
- **WHEN** user attempts to delete a task with status DONE
- **THEN** the delete is rejected with error "Cannot delete completed task"

#### Scenario: Allow edit before done
- **WHEN** user edits a task with status TODO or IN_PROGRESS
- **THEN** the edit is allowed normally
