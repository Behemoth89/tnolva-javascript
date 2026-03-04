## 1. Data Layer Changes

- [x] 1.1 Add `isSystemCreated: boolean` field to ITaskEntity interface
- [x] 1.2 Remove `recurrenceTemplateId` from ITaskEntity interface
- [x] 1.3 Remove `recurrenceTemplateId` from ITaskCreateDto (data layer)
- [x] 1.4 Remove `recurrenceTemplateId` from ITaskUpdateDto (data layer)
- [x] 1.5 Update Task domain class for new fields

## 2. BLL DTOs Creation

- [x] 2.1 Create `src/bll/interfaces/dtos/` folder
- [x] 2.2 Create `IBllTaskCreateDto` with categoryId field
- [x] 2.3 Create `IBllTaskUpdateDto` with categoryId field
- [x] 2.4 Create `IBllTaskDto` with category info (categoryId, categoryName, categoryColor)

## 3. Repository Changes

- [x] 3.1 Update TaskRepository to handle isSystemCreated field in queries
- [x] 3.2 Add method to CategoryRepository for getting assignment by taskId
- [x] 3.3 Add method to CategoryRepository for deleting assignment by taskId

## 4. UnitOfWork Changes

- [x] 4.1 Ensure UnitOfWork can access CategoryRepository for assignment operations

## 5. Service Layer Changes

- [x] 5.1 Update ITaskService interface to use BLL DTOs
- [x] 5.2 Update TaskService.createAsync() to use IBllTaskCreateDto
- [x] 5.3 Update TaskService.updateAsync() to use IBllTaskUpdateDto
- [x] 5.4 Implement category assignment when categoryId is provided in create
- [x] 5.5 Handle category changes (set, update, clear) in update
- [x] 5.6 Delete category assignment when task is deleted
- [x] 5.7 Add methods to return IBllTaskDto with category info (getAllAsync, getByIdAsync, etc.)
- [x] 5.8 Map ITaskEntity to IBllTaskDto with category joined from junction table

## 6. UI Changes

- [x] 6.1 Add category dropdown to task create form in tasks-crud.ts
- [x] 6.2 Add category dropdown to task update form in tasks-crud.ts
- [x] 6.3 Load categories when task form opens
- [x] 6.4 Pass categoryId to bridge.createTask() / bridge.updateTask()
- [x] 6.5 Update UiBridge to use BLL DTOs and pass categoryId to TaskService
- [x] 6.6 Display category in task list table (name and color)
