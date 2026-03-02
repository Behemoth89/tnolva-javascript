## 1. Move Entity Interfaces to entities/ Folder

- [x] 1.1 Create IEntityId.ts in src/interfaces/entities/
- [x] 1.2 Create IBaseEntity.ts in src/interfaces/entities/
- [x] 1.3 Create ITaskEntity.ts in src/interfaces/entities/
- [x] 1.4 Create IRecurringTaskEntity.ts in src/interfaces/entities/
- [x] 1.5 Create IRecurrenceTemplateEntity.ts in src/interfaces/entities/
- [x] 1.6 Create ITaskCategoryEntity.ts in src/interfaces/entities/
- [x] 1.7 Create ITaskDependencyEntity.ts in src/interfaces/entities/
- [x] 1.8 Create ITaskRecurringLinkEntity.ts in src/interfaces/entities/
- [x] 1.9 Create IInterval.ts in src/interfaces/entities/
- [x] 1.10 Create ISubtaskTemplate.ts in src/interfaces/entities/

## 2. Move DTO Interfaces to dtos/ Folder

- [x] 2.1 Create ITaskCreateDto.ts in src/interfaces/dtos/
- [x] 2.2 Create ITaskUpdateDto.ts in src/interfaces/dtos/
- [x] 2.3 Create ITaskCategoryCreateDto.ts in src/interfaces/dtos/
- [x] 2.4 Create ITaskCategoryUpdateDto.ts in src/interfaces/dtos/
- [x] 2.5 Create IRecurringTaskCreateDto.ts in src/interfaces/dtos/
- [x] 2.6 Create IRecurringTaskUpdateDto.ts in src/interfaces/dtos/
- [x] 2.7 Create ITaskDependencyCreateDto.ts in src/interfaces/dtos/
- [x] 2.8 Create ISubtaskTemplateCreateDto.ts in src/interfaces/dtos/

## 3. Move Repository Interfaces to repositories/ Folder

- [x] 3.1 Create IRepository.ts in src/interfaces/repositories/
- [x] 3.2 Create ITaskRepository.ts in src/interfaces/repositories/
- [x] 3.3 Create ICategoryRepository.ts in src/interfaces/repositories/
- [x] 3.4 Create IRecurrenceTemplateRepository.ts in src/interfaces/repositories/
- [x] 3.5 Create IRecurringTaskRepository.ts in src/interfaces/repositories/
- [x] 3.6 Create ITaskDependencyRepository.ts in src/interfaces/repositories/
- [x] 3.7 Create ITaskRecurringLinkRepository.ts in src/interfaces/repositories/

## 4. Move Cross-Cutting Interfaces to Root

- [x] 4.1 Keep IUnitOfWork.ts in src/interfaces/
- [x] 4.2 Keep IUnitOfWorkFactory.ts in src/interfaces/

## 5. Update Domain Layer Imports

- [x] 5.1 Update Task.ts to import from new locations
- [x] 5.2 Update RecurringTask.ts to import from new locations
- [x] 5.3 Update RecurrenceTemplate.ts to import from new locations
- [x] 5.4 Update TaskCategory.ts to import from new locations
- [x] 5.5 Update TaskDependency.ts to import from new locations
- [x] 5.6 Update TaskRecurringLink.ts to import from new locations
- [x] 5.7 Update domain/index.ts if needed

## 6. Update BLL Layer Imports

- [x] 6.1 Update TaskService.ts imports
- [x] 6.2 Update CategoryService.ts imports
- [x] 6.3 Update RecurrenceService.ts imports
- [x] 6.4 Update RecurringTaskService.ts imports
- [x] 6.5 Update TaskDependencyService.ts imports

## 7. Update Data Layer Imports

- [x] 7.1 Update BaseRepository.ts imports
- [x] 7.2 Update TaskRepository.ts imports
- [x] 7.3 Update CategoryRepository.ts imports
- [x] 7.4 Update RecurrenceTemplateRepository.ts imports
- [x] 7.5 Update RecurringTaskRepository.ts imports
- [x] 7.6 Update TaskDependencyRepository.ts imports
- [x] 7.7 Update TaskRecurringLinkRepository.ts imports
- [x] 7.8 Update UnitOfWork.ts imports

## 8. Update Test Imports

- [x] 8.1 Update TaskService.test.ts imports
- [x] 8.2 Update CategoryService.test.ts imports
- [x] 8.3 Update RecurrenceService.test.ts imports
- [x] 8.4 Update UnitOfWork.test.ts imports

## 9. Update Interface Index Exports

- [x] 9.1 Update src/interfaces/index.ts to export from new paths

## 10. Verify and Clean Up

- [x] 10.1 Run TypeScript compiler to verify no import errors
- [x] 10.2 Run tests to verify functionality
- [x] 10.3 Remove old interface files from src/interfaces/ root
- [x] 10.4 Run TypeScript compiler again after removing old files to catch any missed imports
- [x] 10.5 Fix any import errors found after old file removal
