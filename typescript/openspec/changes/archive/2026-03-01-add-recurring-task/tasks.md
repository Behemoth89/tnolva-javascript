## 1. Data Model

- [x] 1.1 Create IInterval interface (value: number, unit: 'days' | 'weeks' | 'months' | 'years')
- [x] 1.2 Create IRecurrenceTemplate interface (id, name, intervals[], dayOfMonth?, weekday?)
- [x] 1.3 Create RecurrenceTemplate entity class
- [x] 1.4 Add recurrenceTemplateId field to ITask interface
- [x] 1.5 Add recurrenceTemplateId field to Task entity class
- [x] 1.6 Update Task constructor to handle recurrenceTemplateId

## 2. Recurrence Template Repository

- [x] 2.1 Create RecurrenceTemplateRepository class
- [x] 2.2 Implement create() method
- [x] 2.3 Implement getById() method
- [x] 2.4 Implement getAll() method
- [x] 2.5 Implement update() method
- [x] 2.6 Implement delete() method (prevent if tasks reference it)
- [x] 2.7 Implement initialization with default templates

## 3. Recurrence Calculator Service

- [x] 3.1 Create RecurrenceCalculator class
- [x] 3.2 Implement calculateNextOccurrence() method
- [x] 3.3 Handle single interval (days, weeks, months, years)
- [x] 3.4 Handle multiple intervals (compound) - apply sequentially
- [x] 3.5 Handle month edge cases (31st day)
- [x] 3.6 Add validation for positive interval values
- [x] 3.7 Handle weekday-based recurrence (occurrenceInMonth + weekday)
- [x] 3.8 Handle "last" occurrence (occurrenceInMonth = -1)

## 4. Recurring Task Generator Service

- [x] 4.1 Create RecurringTaskGenerator class
- [x] 4.2 Implement generateNextInstance() method
- [x] 4.3 Generate unique ID for new task instance
- [x] 4.4 Preserve title, description, priority, tags from original
- [x] 4.5 Preserve recurrenceTemplateId reference
- [x] 4.6 Calculate new dueDate using RecurrenceCalculator

## 5. Integration with Task Completion

- [x] 5.1 Modify Task.complete() to trigger recurrence generation
- [x] 5.2 Register new task with TaskRepository
- [x] 5.3 Handle case when task has no recurrenceTemplateId (no generation)

## 6. Tests

- [x] 6.1 Write unit tests for RecurrenceTemplateRepository
- [x] 6.2 Write unit tests for RecurrenceCalculator (all interval types)
- [x] 6.3 Write unit tests for RecurringTaskGenerator
- [x] 6.4 Write integration tests for task completion with recurrence

## 7. Documentation

- [ ] 7.1 Add JSDoc comments to new interfaces and classes
- [ ] 7.2 Update README with recurrence template usage guide
