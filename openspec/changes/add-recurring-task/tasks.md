## 1. Data Model

- [ ] 1.1 Create IInterval interface (value: number, unit: 'days' | 'weeks' | 'months' | 'years')
- [ ] 1.2 Create IRecurrenceTemplate interface (id, name, intervals[], dayOfMonth?, weekday?)
- [ ] 1.3 Create RecurrenceTemplate entity class
- [ ] 1.4 Add recurrenceTemplateId field to ITask interface
- [ ] 1.5 Add recurrenceTemplateId field to Task entity class
- [ ] 1.6 Update Task constructor to handle recurrenceTemplateId

## 2. Recurrence Template Repository

- [ ] 2.1 Create RecurrenceTemplateRepository class
- [ ] 2.2 Implement create() method
- [ ] 2.3 Implement getById() method
- [ ] 2.4 Implement getAll() method
- [ ] 2.5 Implement update() method
- [ ] 2.6 Implement delete() method (prevent if tasks reference it)
- [ ] 2.7 Implement initialization with default templates

## 3. Recurrence Calculator Service

- [ ] 3.1 Create RecurrenceCalculator class
- [ ] 3.2 Implement calculateNextOccurrence() method
- [ ] 3.3 Handle single interval (days, weeks, months, years)
- [ ] 3.4 Handle multiple intervals (compound) - apply sequentially
- [ ] 3.5 Handle month edge cases (31st day)
- [ ] 3.6 Add validation for positive interval values
- [ ] 3.7 Handle weekday-based recurrence (occurrenceInMonth + weekday)
- [ ] 3.8 Handle "last" occurrence (occurrenceInMonth = -1)

## 4. Recurring Task Generator Service

- [ ] 4.1 Create RecurringTaskGenerator class
- [ ] 4.2 Implement generateNextInstance() method
- [ ] 4.3 Generate unique ID for new task instance
- [ ] 4.4 Preserve title, description, priority, tags from original
- [ ] 4.5 Preserve recurrenceTemplateId reference
- [ ] 4.6 Calculate new dueDate using RecurrenceCalculator

## 5. Integration with Task Completion

- [ ] 5.1 Modify Task.complete() to trigger recurrence generation
- [ ] 5.2 Register new task with TaskRepository
- [ ] 5.3 Handle case when task has no recurrenceTemplateId (no generation)

## 6. Tests

- [ ] 6.1 Write unit tests for RecurrenceTemplateRepository
- [ ] 6.2 Write unit tests for RecurrenceCalculator (all interval types)
- [ ] 6.3 Write unit tests for RecurringTaskGenerator
- [ ] 6.4 Write integration tests for task completion with recurrence

## 7. Documentation

- [ ] 7.1 Add JSDoc comments to new interfaces and classes
- [ ] 7.2 Update README with recurrence template usage guide
