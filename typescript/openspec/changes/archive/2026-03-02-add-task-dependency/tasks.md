## 1. Domain Layer

- [x] 1.1 Create EDependencyType enum in src/enums/EDependencyType.ts
- [x] 1.2 Create ITaskDependency interface in src/interfaces/ITaskDependency.ts
- [x] 1.3 Create TaskDependency domain model in src/domain/TaskDependency.ts
- [x] 1.4 Add dependency methods to Task domain entity (getSubtasks, getParentTask, hasSubtasks, hasIncompleteSubtasks)

## 2. Add StartDate to Task

- [x] 2.1 Add startDate field to ITask interface in src/interfaces/ITask.ts (required, not nullable)
- [x] 2.2 Add startDate to Task domain model in src/domain/Task.ts
- [x] 2.3 Add startDate to ITaskCreateDto in src/interfaces/ITaskCreateDto.ts
- [x] 2.4 Add startDate to ITaskUpdateDto in src/interfaces/ITaskUpdateDto.ts
- [x] 2.5 Add default value logic: if startDate not specified, default to creation timestamp
- [x] 2.6 Add validation: startDate cannot be after dueDate
- [x] 2.7 Update TaskService to handle startDate in create/update operations

## 3. Add Duration to Recurring Tasks

- [x] 3.1 Add duration field to RecurrenceTemplate (task length in days)
- [x] 3.2 Modify RecurringTaskGenerator to calculate dueDate = startDate + duration
- [x] 3.3 Recurring tasks recur by start date (not due date)

## 4. Repository Layer

- [x] 2.1 Create ITaskDependencyRepository interface in src/interfaces/ITaskDependencyRepository.ts
- [x] 2.2 Create TaskDependencyRepository in src/data/repositories/TaskDependencyRepository.ts
- [x] 2.3 Implement addDependency method
- [x] 2.4 Implement removeDependency method
- [x] 2.5 Implement getDependenciesForTask method (tasks this task depends on)
- [x] 2.6 Implement getDependents method (tasks that depend on this task)
- [x] 2.7 Implement hasDependency method
- [x] 2.8 Register repository in src/data/repositories/index.ts

## 3. Validation Services

- [x] 3.1 Create direct circular reference validation (check if target already depends on source)
- [x] 3.2 Create dependency status validation service
- [x] 3.3 Implement check for incomplete subtasks before completing main task
- [x] 3.4 Create due date warning service
- [x] 3.5 Implement due date conflict detection

## 4. BLL Layer

- [x] 4.1 Create ITaskDependencyService interface in src/bll/interfaces/ITaskDependencyService.ts
- [x] 4.2 Create TaskDependencyService in src/bll/services/TaskDependencyService.ts
- [x] 4.3 Implement addSubtask method with circular reference check
- [x] 4.4 Implement removeSubtask method
- [x] 4.5 Implement getSubtasks method
- [x] 4.6 Implement canCompleteMainTask method (checks if all subtasks done)
- [x] 4.7 Implement checkDueDateConflict method with warning
- [x] 4.8 Extend TaskService to call dependency validation on status updates

## 5. Unit of Work Integration

- [x] 5.1 Add TaskDependencyRepository to UnitOfWork
- [x] 5.2 Add TaskDependencyService to UnitOfWork
- [x] 5.3 Implement cascade delete for dependencies when task is deleted
- [x] 5.4 Update UnitOfWorkFactory to create new repositories/services

## 6. Testing

- [x] 6.1 Write unit tests for TaskDependency domain model
- [x] 6.2 Write unit tests for TaskDependencyRepository CRUD operations
- [ ] 6.3 Write unit tests for direct circular reference validation
- [ ] 6.4 Write unit tests for dependency status enforcement
- [ ] 6.5 Write unit tests for due date warning logic
- [x] 6.6 Write integration tests for TaskDependencyService (partial - core tests exist)
- [x] 6.7 Write unit tests for startDate validation (cannot be after dueDate)
- [ ] 6.8 Write unit tests for subtask template generation
- [ ] 6.9 Write tests for generated subtask date calculation from startDate
- [ ] 6.10 Write tests for cascade delete of generated subtasks
- [x] 6.11 Write unit tests for task-duration in recurring templates
- [x] 6.12 Write unit tests for recurrence by start date (not due date)

## 7. DTO Updates (if needed)

- [x] 7.1 Update ITaskUpdateDto to include dependency-related fields if needed
- [x] 7.2 Update ITaskCreateDto to support creating task with parent

## 8. Subtask Template for Recurring Tasks

- [x] 8.1 Create ISubtaskTemplate interface in src/interfaces/ISubtaskTemplate.ts
- [x] 8.2 Extend IRecurrenceTemplate to include subtaskTemplates array
- [x] 8.3 Update RecurrenceTemplate domain model to support subtask templates
- [x] 8.4 Modify RecurringTaskGenerator to generate subtasks when parent is generated
- [x] 8.5 Calculate subtask startDate using parent.startDate + startDateOffset
- [x] 8.6 Calculate subtask dueDate using startDate + duration (or from offset)
- [x] 8.7 Validate: subtask dueDate must be <= parent dueDate
- [x] 8.8 Create TaskDependency records linking generated subtasks to parent
- [x] 8.9 Skip due date warning for generated subtasks (template-created, not user-created)
- [x] 8.10 Ensure cascade delete works for generated subtasks when parent is deleted
