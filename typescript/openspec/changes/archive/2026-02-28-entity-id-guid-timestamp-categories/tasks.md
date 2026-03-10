# Implementation Tasks: Entity ID, GUID, Timestamp & Categories

## 1. Interface Extensions

- [x] 1.1 Create IEntityId interface in src/interfaces/IEntityId.ts
- [x] 1.2 Create IBaseEntity interface in src/interfaces/IBaseEntity.ts with createdAt and updatedAt
- [x] 1.3 Update ITask interface to extend IBaseEntity in src/interfaces/ITask.ts
- [x] 1.4 Export new interfaces from src/interfaces/index.ts
- [x] 1.5 Update ITaskCreateDto to include optional timestamps
- [x] 1.6 Update ITaskUpdateDto to include optional timestamps

## 2. GUID Utility

- [x] 2.1 Create guid.ts utility in src/utils/guid.ts using crypto.randomUUID()
- [x] 2.2 Export generateGuid function from src/utils/index.ts (or create index)
- [x] 2.3 Write unit tests for guid utility

## 3. BaseRepository Updates

- [x] 3.1 Update BaseRepository to import and use generateGuid()
- [x] 3.2 Add timestamp helper methods to BaseRepository
- [x] 3.3 Modify createAsync to set createdAt and updatedAt
- [x] 3.4 Modify updateAsync to set updatedAt only
- [x] 3.5 Ensure timestamps are set only for IBaseEntity implementing types

## 4. Task Entity Updates

- [x] 4.1 Update Task class to implement IBaseEntity
- [x] 4.2 Remove categoryId property (now using many-to-many)
- [x] 4.3 Update toObject() to include timestamps
- [x] 4.4 Update constructor to handle timestamps

## 5. Task Category Interface

- [x] 5.1 Create ITaskCategory interface in src/interfaces/ITaskCategory.ts
- [x] 5.2 Create ITaskCategoryCreateDto interface
- [x] 5.3 Create ITaskCategoryUpdateDto interface
- [x] 5.4 Export new category interfaces from src/interfaces/index.ts

## 6. Task Category Domain Entity

- [x] 6.1 Create TaskCategory class in src/domain/TaskCategory.ts
- [x] 6.2 Implement constructor with validation
- [x] 6.3 Implement update() method
- [x] 6.4 Implement toObject() method

## 7. Category Assignment (Junction Table)

- [x] 7.1 Create ITaskCategoryAssignment interface in src/interfaces/ITaskCategoryAssignment.ts
- [x] 7.2 Add STORAGE_KEY_CATEGORY_ASSIGNMENTS to src/data/storageKeys.ts
- [x] 7.3 Implement assignment repository for CRUD operations
- [x] 7.4 Add method to assign task to category
- [x] 7.5 Add method to remove task from category
- [x] 7.6 Add method to get categories for a task
- [x] 7.7 Add method to get tasks for a category

## 8. Category Repository

- [x] 8.1 Create ICategoryRepository interface in src/interfaces/ICategoryRepository.ts
- [x] 8.2 Create CategoryRepository class in src/data/repositories/CategoryRepository.ts
- [x] 8.3 Extend BaseRepository for CategoryRepository
- [x] 8.4 Implement getEntityId and setEntityId
- [x] 8.5 Export from src/data/repositories/index.ts

## 9. Storage Keys

- [x] 9.1 Add STORAGE_KEY_CATEGORIES to src/data/storageKeys.ts

## 10. Task Repository Updates

- [x] 10.1 Update TaskRepository to work with category assignments
- [x] 10.2 Add method to get tasks by category

## 11. Unit of Work Updates

- [x] 11.1 Add CategoryRepository to UnitOfWork
- [x] 11.2 Add category assignment methods to UnitOfWork
- [x] 11.3 Add getter for CategoryRepository
- [x] 11.4 Export updated IUnitOfWork interface

## 12. ITaskWithRelations Updates (Business Logic - Removed)

- [ ] 12.1 Update ITaskWithRelations to include category relationship
- [ ] 12.2 Add categories property to interface (array)

## 13. Testing

- [x] 13.1 Write unit tests for IEntityId and IBaseEntity
- [x] 13.2 Write unit tests for generateGuid()
- [x] 13.3 Update TaskRepository tests for timestamps
- [x] 13.4 Write unit tests for CategoryRepository
- [x] 13.5 Write unit tests for CategoryAssignment
- [x] 13.6 Update UnitOfWork tests
- [x] 13.7 Run all tests to ensure no regressions
