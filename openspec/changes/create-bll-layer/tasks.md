## 1. BLL Layer Setup

- [ ] 1.1 Create `src/bll/` directory structure
- [ ] 1.2 Create `src/bll/interfaces/` directory
- [ ] 1.3 Create `src/bll/services/` directory
- [ ] 1.4 Create `src/bll/index.ts` with exports
- [ ] 1.5 Add BLL exports to main `src/index.ts` (if exists)

## 2. BLL Service Interfaces

- [ ] 2.1 Create `src/bll/interfaces/ITaskService.ts` interface
- [ ] 2.2 Create `src/bll/interfaces/ICategoryService.ts` interface
- [ ] 2.3 Create `src/bll/interfaces/IRecurrenceService.ts` interface
- [ ] 2.4 Create `src/bll/interfaces/IBllServiceFactory.ts` interface

## 3. TaskService Implementation

- [ ] 3.1 Create `src/bll/services/TaskService.ts` class
- [ ] 3.2 Implement `createAsync()` method with validation
- [ ] 3.3 Implement `updateAsync()` method with validation
- [ ] 3.4 Implement `startAsync()` for TODO → IN_PROGRESS transition
- [ ] 3.5 Implement `completeAsync()` for IN_PROGRESS → DONE transition
- [ ] 3.6 Implement `cancelAsync()` for any → CANCELLED transition
- [ ] 3.7 Implement `addTagAsync()` and `removeTagAsync()` methods
- [ ] 3.8 Implement `changePriorityAsync()` method
- [ ] 3.9 Implement `getByStatusAsync()` and `getByPriorityAsync()` queries

## 4. CategoryService Implementation

- [ ] 4.1 Create `src/bll/services/CategoryService.ts` class
- [ ] 4.2 Implement `createAsync()` with duplicate name handling
- [ ] 4.3 Implement `assignTaskToCategoryAsync()` method
- [ ] 4.4 Implement `removeTaskFromCategoryAsync()` method
- [ ] 4.5 Implement `getCategoriesForTaskAsync()` method
- [ ] 4.6 Implement `getTasksForCategoryAsync()` method
- [ ] 4.7 Implement `getByNameAsync()` method

## 5. RecurrenceService Implementation

- [ ] 5.1 Create `src/bll/services/RecurrenceService.ts` class
- [ ] 5.2 Move `RecurrenceCalculator` logic from domain to this service
- [ ] 5.3 Move `RecurringTaskGenerator` logic from domain to this service
- [ ] 5.4 Implement `generateNextTaskAsync()` for recurring task creation
- [ ] 5.5 Implement `calculateNextOccurrenceAsync()` method
- [ ] 5.6 Handle month-end edge cases for monthly recurrence

## 6. BLL Service Factory

- [ ] 6.1 Create `src/bll/BllServiceFactory.ts` class
- [ ] 6.2 Implement factory methods to create services with UoW
- [ ] 6.3 Ensure proper dependency injection

## 7. UnitOfWork Refactoring

- [ ] 7.1 Refactor `UnitOfWork.ts` to use BLL services
- [ ] 7.2 Remove business logic from `completeTaskWithRecurrence()`
- [ ] 7.3 Delegate task operations to TaskService
- [ ] 7.4 Delegate category operations to CategoryService

## 8. Domain Layer Simplification

- [ ] 8.1 Simplify `Task.ts` - remove business methods, keep data structure
- [ ] 8.2 Simplify `TaskCategory.ts` - remove business methods
- [ ] 8.3 Move `RecurrenceCalculator.ts` to BLL services
- [ ] 8.4 Move `RecurringTaskGenerator.ts` to BLL services
- [ ] 8.5 Update `src/domain/index.ts` exports

## 9. Testing Updates

- [ ] 9.1 Update existing UnitOfWork tests to mock BLL services
- [ ] 9.2 Create unit tests for TaskService
- [ ] 9.3 Create unit tests for CategoryService
- [ ] 9.4 Create unit tests for RecurrenceService
- [ ] 9.5 Ensure all existing tests still pass

## 10. Integration & Verification

- [ ] 10.1 Verify build succeeds with `npm run build`
- [ ] 10.2 Run all tests with `npm run test:run`
- [ ] 10.3 Verify no breaking changes to existing functionality
- [ ] 10.4 Update any documentation if needed
