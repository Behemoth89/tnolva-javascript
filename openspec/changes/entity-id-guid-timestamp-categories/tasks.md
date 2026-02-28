# Implementation Tasks: Entity ID, GUID, Timestamp & Categories

## 1. Interface Extensions

- [ ] 1.1 Create IEntityId interface in src/interfaces/IEntityId.ts
- [ ] 1.2 Create IBaseEntity interface in src/interfaces/IBaseEntity.ts with createdAt and updatedAt
- [ ] 1.3 Update ITask interface to extend IBaseEntity in src/interfaces/ITask.ts
- [ ] 1.4 Export new interfaces from src/interfaces/index.ts
- [ ] 1.5 Update ITaskCreateDto to include optional timestamps
- [ ] 1.6 Update ITaskUpdateDto to include optional timestamps

## 2. GUID Utility

- [ ] 2.1 Create guid.ts utility in src/utils/guid.ts using crypto.randomUUID()
- [ ] 2.2 Export generateGuid function from src/utils/index.ts (or create index)
- [ ] 2.3 Write unit tests for guid utility

## 3. BaseRepository Updates

- [ ] 3.1 Update BaseRepository to import and use generateGuid()
- [ ] 3.2 Add timestamp helper methods to BaseRepository
- [ ] 3.3 Modify createAsync to set createdAt and updatedAt
- [ ] 3.4 Modify updateAsync to set updatedAt only
- [ ] 3.5 Ensure timestamps are set only for IBaseEntity implementing types

## 4. Task Entity Updates

- [ ] 4.1 Update Task class to implement IBaseEntity
- [ ] 4.2 Remove categoryId property (now using many-to-many)
- [ ] 4.3 Update toObject() to include timestamps
- [ ] 4.4 Update constructor to handle timestamps

## 5. Task Category Interface

- [ ] 5.1 Create ITaskCategory interface in src/interfaces/ITaskCategory.ts
- [ ] 5.2 Create ITaskCategoryCreateDto interface
- [ ] 5.3 Create ITaskCategoryUpdateDto interface
- [ ] 5.4 Export new category interfaces from src/interfaces/index.ts

## 6. Task Category Domain Entity

- [ ] 6.1 Create TaskCategory class in src/domain/TaskCategory.ts
- [ ] 6.2 Implement constructor with validation
- [ ] 6.3 Implement update() method
- [ ] 6.4 Implement toObject() method

## 7. Category Assignment (Junction Table)

- [ ] 7.1 Create ITaskCategoryAssignment interface in src/interfaces/ITaskCategoryAssignment.ts
- [ ] 7.2 Add STORAGE_KEY_CATEGORY_ASSIGNMENTS to src/data/storageKeys.ts
- [ ] 7.3 Implement assignment repository for CRUD operations
- [ ] 7.4 Add method to assign task to category
- [ ] 7.5 Add method to remove task from category
- [ ] 7.6 Add method to get categories for a task
- [ ] 7.7 Add method to get tasks for a category

## 8. Category Repository

- [ ] 8.1 Create ICategoryRepository interface in src/interfaces/ICategoryRepository.ts
- [ ] 8.2 Create CategoryRepository class in src/data/repositories/CategoryRepository.ts
- [ ] 8.3 Extend BaseRepository for CategoryRepository
- [ ] 8.4 Implement getEntityId and setEntityId
- [ ] 8.5 Export from src/data/repositories/index.ts

## 9. Storage Keys

- [ ] 9.1 Add STORAGE_KEY_CATEGORIES to src/data/storageKeys.ts

## 10. Task Repository Updates

- [ ] 10.1 Update TaskRepository to work with category assignments
- [ ] 10.2 Add method to get tasks by category

## 11. Unit of Work Updates

- [ ] 11.1 Add CategoryRepository to UnitOfWork
- [ ] 11.2 Add category assignment methods to UnitOfWork
- [ ] 11.3 Add getter for CategoryRepository
- [ ] 11.4 Export updated IUnitOfWork interface

## 12. ITaskWithRelations Updates

- [ ] 12.1 Update ITaskWithRelations to include category relationship
- [ ] 12.2 Add categories property to interface (array)

## 13. Testing

- [ ] 13.1 Write unit tests for IEntityId and IBaseEntity
- [ ] 13.2 Write unit tests for generateGuid()
- [ ] 13.3 Update TaskRepository tests for timestamps
- [ ] 13.4 Write unit tests for CategoryRepository
- [ ] 13.5 Write unit tests for CategoryAssignment
- [ ] 13.6 Update UnitOfWork tests
- [ ] 13.7 Run all tests to ensure no regressions
