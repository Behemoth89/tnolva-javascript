## 1. BLL Layer Setup

- [x] 1.1 Create `src/bll/` directory structure
- [x] 1.2 Create `src/bll/interfaces/` directory
- [x] 1.3 Create `src/bll/services/` directory
- [x] 1.4 Create `src/bll/index.ts` with exports
- [x] 1.5 Add BLL exports to main `src/index.ts` (if exists)

## 2. BLL Service Interfaces

- [x] 2.1 Create `src/bll/interfaces/ITaskService.ts` interface
- [x] 2.2 Create `src/bll/interfaces/ICategoryService.ts` interface
- [x] 2.3 Create `src/bll/interfaces/IRecurrenceService.ts` interface
- [x] 2.4 Create `src/bll/interfaces/IBllServiceFactory.ts` interface

## 3. TaskService Implementation

- [x] 3.1 Create `src/bll/services/TaskService.ts` class
- [x] 3.2 Implement `createAsync()` method with validation
- [x] 3.3 Implement `updateAsync()` method with validation
- [x] 3.4 Implement `startAsync()` for TODO → IN_PROGRESS transition
- [x] 3.5 Implement `completeAsync()` for IN_PROGRESS → DONE transition
- [x] 3.6 Implement `cancelAsync()` for any → CANCELLED transition
- [x] 3.7 Implement `addTagAsync()` and `removeTagAsync()` methods
- [x] 3.8 Implement `changePriorityAsync()` method
- [x] 3.9 Implement `getByStatusAsync()` and `getByPriorityAsync()` queries

## 4. CategoryService Implementation

- [x] 4.1 Create `src/bll/services/CategoryService.ts` class
- [x] 4.2 Implement `createAsync()` with duplicate name handling
- [x] 4.3 Implement `assignTaskToCategoryAsync()` method
- [x] 4.4 Implement `removeTaskFromCategoryAsync()` method
- [x] 4.5 Implement `getCategoriesForTaskAsync()` method
- [x] 4.6 Implement `getTasksForCategoryAsync()` method
- [x] 4.7 Implement `getByNameAsync()` method

## 5. RecurrenceService Implementation

- [x] 5.1 Create `src/bll/services/RecurrenceService.ts` class
- [x] 5.2 Move `RecurrenceCalculator` logic from domain to this service
- [x] 5.3 Move `RecurringTaskGenerator` logic from domain to this service
- [x] 5.4 Implement `generateNextTaskAsync()` for recurring task creation
- [x] 5.5 Implement `calculateNextOccurrenceAsync()` method
- [x] 5.6 Handle month-end edge cases for monthly recurrence

## 6. BLL Service Factory

- [x] 6.1 Create `src/bll/BllServiceFactory.ts` class
- [x] 6.2 Implement factory methods to create services with UoW
- [x] 6.3 Ensure proper dependency injection

## 7. UnitOfWork Refactoring

- [x] 7.1 Refactor `UnitOfWork.ts` to use BLL services
- [x] 7.2 Remove business logic from `completeTaskWithRecurrence()`
- [x] 7.3 Delegate task operations to TaskService
- [x] 7.4 Delegate category operations to CategoryService

## 8. Domain Layer Simplification

- [x] 8.1 Simplify `Task.ts` - remove business methods, keep data structure
- [x] 8.2 Simplify `TaskCategory.ts` - remove business methods
- [x] 8.3 Move `RecurrenceCalculator.ts` to BLL services
- [x] 8.4 Move `RecurringTaskGenerator.ts` to BLL services
- [x] 8.5 Update `src/domain/index.ts` exports

## 9. Testing Updates

- [x] 9.1 Update tests to mock BLL services
- [x] 9.2 Create unit tests for Task existing UnitOfWorkService
- [x] 9.3 Create unit tests for CategoryService
- [x] 9.4 Create unit tests for RecurrenceService
- [x] 9.5 Ensure all existing tests still pass

## 10. Integration & Verification

- [x] 10.1 Verify build succeeds with `npm run build`
- [x] 10.2 Run all tests with `npm run test:run`
- [x] 10.3 Verify no breaking changes to existing functionality
- [x] 10.4 Update any documentation if needed
