## Why

Currently, the Task entity uses `recurrenceTemplateId` to track if a task was created from a recurring template. This couples the task directly to the recurrence template, making it difficult to track other system-generated task sources. Additionally, tasks do not have category assignment in the UI, even though the junction tables `ITaskCategoryAssignmentEntity` and `ITaskRecurringLinkEntity` already exist in the data layer.

## What Changes

- **Remove** `recurrenceTemplateId` field from Task entity
- **Add** `isSystemCreated` boolean field to Task entity to indicate if task was created by system (recurring task generator, future sources) vs manually by user
- **Add** category selection to task creation and update forms in UI (using existing `ITaskCategoryAssignmentEntity` junction table)
- **Update** TaskService to handle category assignment via the existing junction table
- **Update** TaskRepository and UnitOfWork to handle the new `isSystemCreated` field

Note: The existing `ITaskRecurringLinkEntity` junction table is already used for tracking task-to-recurring-task relationships - no new junction table needed.

## Capabilities

### New Capabilities
- `task-is-system-created`: Boolean flag on Task entity to distinguish manually-created vs system-created tasks
- `task-category-field`: UI field to select category when creating or updating a task

### Modified Capabilities
- `task-entity`: Modify existing task entity - remove `recurrenceTemplateId`, add `isSystemCreated`
- `task-repository`: Update to handle new field
- `task-service`: Update to handle category assignment via existing `ITaskCategoryAssignmentEntity` junction table
- `task-crud`: Add category field to create and update operations

## Impact

- **Data Layer**: Task entity schema change (remove `recurrenceTemplateId`, add `isSystemCreated`)
- **Repository Layer**: Updates to TaskRepository for new field
- **Service Layer**: TaskService enhancement for category assignment via existing junction table
- **UI Layer**: Category dropdown in task creation and update forms
- **No breaking changes** to existing APIs - the `isSystemCreated` field defaults to `false` for existing tasks
