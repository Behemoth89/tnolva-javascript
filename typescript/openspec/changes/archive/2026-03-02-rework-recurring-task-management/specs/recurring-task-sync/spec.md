## ADDED Requirements

### Requirement: Sync on Property Change
When recurring task properties (not interval) are modified, the system SHALL update all linked future tasks.

#### Scenario: Update title/description
- **WHEN** recurring task title is changed from "Review reports" to "Review weekly reports"
- **THEN** all linked tasks with status != DONE have their title updated

#### Scenario: Update priority
- **WHEN** recurring task priority is changed from LOW to HIGH
- **THEN** all linked tasks with status != DONE have their priority updated

#### Scenario: Update tags
- **WHEN** recurring task tags are modified
- **THEN** all linked tasks with status != DONE have their tags updated

---

### Requirement: Sync on Interval Change
When recurring task interval is modified, the system SHALL regenerate future tasks.

#### Scenario: Change from daily to weekly
- **WHEN** recurring task interval changes from "every 1 day" to "every 1 week"
- **THEN** all future linked tasks (status != DONE) are deleted
- **AND** new task instances are generated based on new interval
- **AND** junction entries are updated with new task IDs

#### Scenario: Change end date earlier
- **WHEN** recurring task endDate is changed to an earlier date
- **THEN** task instances beyond the new endDate are deleted
- **AND** junction entries are removed for deleted tasks

#### Scenario: Extend end date
- **WHEN** recurring task endDate is extended further
- **THEN** new task instances are generated to fill the gap

---

### Requirement: Stop Recurrence
When a recurring task is stopped, the system SHALL delete all future linked tasks.

#### Scenario: Stop active recurring task
- **WHEN** user stops a recurring task (sets status to STOPPED)
- **THEN** all linked tasks with status != DONE are deleted
- **AND** junction entries are removed
- **AND** the recurring task remains in storage with status STOPPED

#### Scenario: Stop preserves done tasks
- **WHEN** a recurring task is stopped
- **THEN** tasks with status DONE remain unchanged
- **AND** their junction entries are preserved

---

### Requirement: Lock Completed Tasks
Tasks marked DONE SHALL NOT be modified or deleted by sync operations.

#### Scenario: Done task not updated
- **WHEN** recurring task is edited but linked task is DONE
- **THEN** that task is NOT updated (locked)

#### Scenario: Done task not deleted
- **WHEN** recurring task is stopped but linked task is DONE
- **THEN** that task is NOT deleted (locked)

#### Scenario: Regeneration skips done
- **WHEN** interval changes but some linked tasks are DONE
- **THEN** only non-DONE tasks are deleted and regenerated
- **AND** DONE tasks remain untouched

---

### Requirement: Reactivate Stopped Recurring Task
A stopped recurring task SHALL be able to be reactivated.

#### Scenario: Reactivate stopped recurring task
- **WHEN** user changes recurring task status from STOPPED to ACTIVE
- **THEN** new task instances are generated from current date
- **AND** existing DONE tasks remain preserved
