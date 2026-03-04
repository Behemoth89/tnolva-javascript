## Context

This design addresses two improvements to the Task Management Utility:

1. **Task Entity Change**: The current `Task` entity uses `recurrenceTemplateId` to track if a task was created from a recurring template. This couples tasks directly to recurrence templates, making it difficult to track other system-generated task sources.

2. **Category UI**: Currently, tasks can be assigned to categories via the existing junction table `ITaskCategoryAssignmentEntity`, but there's no UI for this - users cannot select a category when creating or updating a task.

### Current Technical State

**Task Entity** ([`src/interfaces/entities/ITaskEntity.ts`](src/interfaces/entities/ITaskEntity.ts)):
```typescript
interface ITaskEntity {
  // ... other fields
  recurrenceTemplateId?: string;  // to be removed
}
```

**Existing Junction Tables**:
- `ITaskCategoryAssignmentEntity` - for task-category relationships (already exists, used by CategoryService)
- `ITaskRecurringLinkEntity` - for task-to-recurring-task relationships (already exists)

**Current UI** ([`src/ui/pages/tasks-crud.ts`](src/ui/pages/tasks-crud.ts)):
- Task create/update form has NO category dropdown
- Uses UiBridge → TaskService (already uses service layer)

**Current Service** ([`src/bll/services/TaskService.ts`](src/bll/services/TaskService.ts)):
- TaskService.createAsync() accepts ITaskCreateDto
- No category field in DTO or entity

## Goals / Non-Goals

**Goals:**
1. Replace `recurrenceTemplateId` with `isSystemCreated` boolean on Task entity
2. Add category selection to task create/update form in UI
3. Update TaskService to handle category assignment via existing `ITaskCategoryAssignmentEntity` junction table
4. Update DTOs, repository, and UnitOfWork for the new field

**Non-Goals:**
- Do NOT create new junction tables (reuse existing)
- Do NOT modify recurring task generation logic
- Do NOT add new system-created task sources (future enhancement)
- Do NOT replace existing task view (it already uses service layer)

## Decisions

### 1. Task Entity Field Change

**Decision**: Replace `recurrenceTemplateId` with `isSystemCreated` boolean

```typescript
// Before
interface ITaskEntity {
  recurrenceTemplateId?: string;
}

// After
interface ITaskEntity {
  isSystemCreated: boolean;  // default: false
}
```

**Rationale**: 
- `isSystemCreated` is more general and supports multiple system sources beyond recurring tasks
- `recurringTaskId` can still be queried via existing `ITaskRecurringLinkEntity` junction table
- Simpler boolean field is more efficient for queries
- Maintains backward compatibility - existing tasks default to `false`

### 2. Category Assignment via DTO and UnitOfWork

**Decision**: Create BLL-specific DTOs. When categoryId is set in BLL DTO, TaskService creates the junction table entity.

**Data Layer DTOs** (no changes to existing):
- ITaskCreateDto - unchanged (no categoryId)
- ITaskUpdateDto - unchanged (no categoryId)

**New BLL DTOs** (src/bll/interfaces/dtos/):
```typescript
// BLL Create DTO - includes categoryId
interface IBllTaskCreateDto extends Omit<ITaskCreateDto, 'recurrenceTemplateId'> {
  categoryId?: string;
  isSystemCreated?: boolean;
}

// BLL Update DTO - includes categoryId  
interface IBllTaskUpdateDto extends Omit<ITaskUpdateDto, 'recurrenceTemplateId'> {
  categoryId?: string;
}

// BLL Task DTO - includes category for display
interface IBllTaskDto extends ITaskEntity {
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
}
```

**Flow:**
1. UI → IBllTaskCreateDto/IBllTaskUpdateDto → TaskService
2. TaskService creates ITaskEntity for storage
3. TaskService returns IBllTaskDto with category info for queries

**Implementation in TaskService**:
```typescript
async createAsync(dto: IBllTaskCreateDto): Promise<IBllTaskDto> {
  // 1. Create task entity (map from BLL DTO to entity)
  const task = await this.taskRepository.createAsync(taskData);
  
  // 2. If categoryId is set, create junction table entry
  if (dto.categoryId) {
    const assignment: ITaskCategoryAssignmentEntity = {
      id: generateGuid(),
      taskId: task.id,
      categoryId: dto.categoryId,
      assignedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.categoryRepository.saveAssignmentAsync(assignment);
  }
  
  // 3. Single commit via UnitOfWork
  await this.unitOfWork.commit();
  
  // 4. Return BLL DTO with category info
  return this.mapToBllDto(task);
}

async getAllAsync(): Promise<IBllTaskDto[]> {
  const tasks = await this.taskRepository.getAllAsync();
  const assignments = await this.categoryRepository.getAllAssignmentsAsync();
  const categories = await this.categoryRepository.getAllAsync();
  
  return tasks.map(task => this.mapToBllDto(task, assignments, categories));
}
```

**Rationale**:
- TaskService owns the task lifecycle - handles both task and category assignment
- Uses UnitOfWork for atomic transactions (task + category assignment in one commit)
- No cross-service dependencies (uses CategoryRepository directly via UnitOfWork)
- Single DTO extension - minimal changes to existing API
- When `categoryId` is set in DTO → creates `ITaskCategoryAssignmentEntity` junction record
- When `categoryId` is cleared/changed in update DTO → updates junction table accordingly

### 3. Delete Handling

**Decision**: When a task is deleted, also delete its category assignment

```typescript
async deleteAsync(id: string): Promise<boolean> {
  // 1. Get task's category assignment
  const assignment = await this.categoryRepository.getByTaskIdAsync(id);
  
  // 2. Delete task
  const result = await this.taskRepository.deleteAsync(id);
  
  // 3. Delete category assignment if exists
  if (assignment) {
    await this.categoryRepository.deleteAssignmentAsync(assignment.id);
  }
  
  await this.unitOfWork.commit();
  return result;
}
```

### 4. UI Category Field

**Decision**: Add category dropdown to task create/update modal form

**Implementation**:
- Fetch all categories on form open
- Display as dropdown with "No category" default option
- Pass categoryId to TaskService via DTO

### 5. Existing Junction Tables Usage

**Decision**: Reuse existing junction tables instead of creating new ones

| Relationship | Existing Interface | Usage |
|--------------|---------------------|-------|
| Task → Category | `ITaskCategoryAssignmentEntity` | Create/delete via TaskService |
| Task → Recurring | `ITaskRecurringLinkEntity` | Already tracks generated tasks |

**Rationale**: Reduces data model complexity, leverages existing code

## Risks / Trade-offs

### Risk: Breaking Changes
**Risk**: Changes to Task entity interface may break existing code

**Mitigation**:
- Keep backward compatible DTOs initially
- Use default values for new `isSystemCreated` field
- Make categoryId optional - existing code continues to work

### Risk: Transaction Scope
**Risk**: Multiple operations need to be atomic

**Mitigation**:
- Use UnitOfWork's commit() for single transaction
- All operations (task create + category assignment) in one scope

## Migration Plan

### Phase 1: Entity and DTO Changes
1. Add `isSystemCreated: boolean` to ITaskEntity (default: false)
2. Add optional `categoryId?: string` to ITaskCreateDto and ITaskUpdateDto
3. Update Task domain class to include new field

### Phase 2: Service Layer Updates
1. Update TaskService to:
   - Create `ITaskCategoryAssignmentEntity` when categoryId is set in create DTO
   - Update/clear junction table when categoryId changes in update DTO
   - Delete junction table entry when task is deleted
2. Access CategoryRepository via UnitOfWork (not CategoryService)

### Phase 3: Repository and UnitOfWork
1. Update TaskRepository to handle new `isSystemCreated` field
2. Add methods to CategoryRepository for assignment CRUD if not exists

### Phase 4: UI Updates
1. Add category dropdown to task form in tasks-crud.ts
2. Load categories on form open
3. Pass categoryId to bridge.createTask() / bridge.updateTask()

### Rollback Strategy
If issues occur:
1. Revert to previous Task entity schema (keep `recurrenceTemplateId`)
2. Revert DTO and service changes
3. Keep both old and new UI until stable

## Open Questions

1. **Should category assignment be required?**
   - Current thinking: No, keep optional - "No category" is valid

2. **Should system-created tasks inherit category from source?**
   - Pending: Decide whether recurring tasks should inherit category from their template

3. **What happens to category when task is deleted?**
   - Decided: Delete junction table entry when task is deleted
