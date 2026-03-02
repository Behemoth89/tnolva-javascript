## 1. Domain Layer

- [ ] 1.1 Create EDependencyType enum in src/enums/EDependencyType.ts
- [ ] 1.2 Create ITaskDependency interface in src/interfaces/ITaskDependency.ts
- [ ] 1.3 Create TaskDependency domain model in src/domain/TaskDependency.ts
- [ ] 1.4 Add dependency methods to Task domain entity (getSubtasks, getParentTask, hasSubtasks, hasIncompleteSubtasks)

## 2. Add StartDate to Task

- [ ] 2.1 Add startDate field to ITask interface in src/interfaces/ITask.ts (required, not nullable)
- [ ] 2.2 Add startDate to Task domain model in src/domain/Task.ts
- [ ] 2.3 Add startDate to ITaskCreateDto in src/interfaces/ITaskCreateDto.ts
- [ ] 2.4 Add startDate to ITaskUpdateDto in src/interfaces/ITaskUpdateDto.ts
- [ ] 2.5 Add default value logic: if startDate not specified, default to creation timestamp
- [ ] 2.6 Add validation: startDate cannot be after dueDate
- [ ] 2.7 Update TaskService to handle startDate in create/update operations

## 3. Add Duration to Recurring Tasks

- [ ] 3.1 Add duration field to RecurrenceTemplate (task length in days)
- [ ] 3.2 Modify RecurringTaskGenerator to calculate dueDate = startDate + duration
- [ ] 3.3 Recurring tasks recur by start date (not due date)

## 4. Repository Layer

- [ ] 2.1 Create ITaskDependencyRepository interface in src/interfaces/ITaskDependencyRepository.ts
- [ ] 2.2 Create TaskDependencyRepository in src/data/repositories/TaskDependencyRepository.ts
- [ ] 2.3 Implement addDependency method
- [ ] 2.4 Implement removeDependency method
- [ ] 2.5 Implement getDependenciesForTask method (tasks this task depends on)
- [ ] 2.6 Implement getDependents method (tasks that depend on this task)
- [ ] 2.7 Implement hasDependency method
- [ ] 2.8 Register repository in src/data/repositories/index.ts

## 3. Validation Services

- [ ] 3.1 Create direct circular reference validation (check if target already depends on source)
- [ ] 3.2 Create dependency status validation service
- [ ] 3.3 Implement check for incomplete subtasks before completing main task
- [ ] 3.4 Create due date warning service
- [ ] 3.5 Implement due date conflict detection

## 4. BLL Layer

- [ ] 4.1 Create ITaskDependencyService interface in src/bll/interfaces/ITaskDependencyService.ts
- [ ] 4.2 Create TaskDependencyService in src/bll/services/TaskDependencyService.ts
- [ ] 4.3 Implement addSubtask method with circular reference check
- [ ] 4.4 Implement removeSubtask method
- [ ] 4.5 Implement getSubtasks method
- [ ] 4.6 Implement canCompleteMainTask method (checks if all subtasks done)
- [ ] 4.7 Implement checkDueDateConflict method with warning
- [ ] 4.8 Extend TaskService to call dependency validation on status updates

## 5. Unit of Work Integration

- [ ] 5.1 Add TaskDependencyRepository to UnitOfWork
- [ ] 5.2 Add TaskDependencyService to UnitOfWork
- [ ] 5.3 Implement cascade delete for dependencies when task is deleted
- [ ] 5.4 Update UnitOfWorkFactory to create new repositories/services

## 6. Testing

- [ ] 6.1 Write unit tests for TaskDependency domain model
- [ ] 6.2 Write unit tests for TaskDependencyRepository CRUD operations
- [ ] 6.3 Write unit tests for direct circular reference validation
- [ ] 6.4 Write unit tests for dependency status enforcement
- [ ] 6.5 Write unit tests for due date warning logic
- [ ] 6.6 Write integration tests for TaskDependencyService
- [ ] 6.7 Write unit tests for startDate validation (cannot be after dueDate)
- [ ] 6.8 Write unit tests for subtask template generation
- [ ] 6.9 Write tests for generated subtask date calculation from startDate
- [ ] 6.10 Write tests for cascade delete of generated subtasks
- [ ] 6.11 Write unit tests for task-duration in recurring templates
- [ ] 6.12 Write unit tests for recurrence by start date (not due date)

## 7. DTO Updates (if needed)

- [ ] 7.1 Update ITaskUpdateDto to include dependency-related fields if needed
- [ ] 7.2 Update ITaskCreateDto to support creating task with parent

## 8. Subtask Template for Recurring Tasks

- [ ] 8.1 Create ISubtaskTemplate interface in src/interfaces/ISubtaskTemplate.ts
- [ ] 8.2 Extend IRecurrenceTemplate to include subtaskTemplates array
- [ ] 8.3 Update RecurrenceTemplate domain model to support subtask templates
- [ ] 8.4 Modify RecurringTaskGenerator to generate subtasks when parent is generated
- [ ] 8.5 Calculate subtask startDate using parent.startDate + startDateOffset
- [ ] 8.6 Calculate subtask dueDate using startDate + duration (or from offset)
- [ ] 8.7 Validate: subtask dueDate must be <= parent dueDate
- [ ] 8.8 Create TaskDependency records linking generated subtasks to parent
- [ ] 8.9 Skip due date warning for generated subtasks (template-created, not user-created)
- [ ] 8.10 Ensure cascade delete works for generated subtasks when parent is deleted
