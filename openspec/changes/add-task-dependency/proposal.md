## Why

Users need to organize complex tasks into hierarchical structures where a main task depends on completion of smaller subtasks. Without dependency management, users cannot enforce that a parent task remains incomplete until all its subtasks are done, leading to incomplete work being marked as complete. This is a fundamental task management pattern needed for project-based workflows.

**v1 Scope:** Single-level hierarchy only - subtasks cannot have their own subtasks.

## What Changes

- Add task dependency system using junction table pattern (`TaskDependency` table)
- Support parent-child task relationships (main task ↔ subtasks) - **one level only in v1**
- Implement validation to prevent direct circular references
- Enforce status constraint: main task cannot be marked done until all subtasks are done
- Add due date validation: warn if subtask due date exceeds main task due date, with option to auto-adjust main task due date
- Add new interfaces: `ITaskDependency`, `ITaskDependencyRepository`
- Add new domain model: `TaskDependency`
- Extend Task entity with dependency-related methods
- **Add startDate to Task** - enables proper subtask date calculation from parent's start date

## Capabilities

### New Capabilities

- `task-dependency-table`: Junction table for task dependencies (task_id, depends_on_task_id, dependency_type) - **v1: one level only**
- `task-dependency-repository`: Repository for CRUD operations on task dependencies
- `direct-circular-reference-check`: Validate that adding a dependency does not create direct circular reference (v1: no transitive check needed)
- `dependency-status-enforcement`: Prevent marking main task as done when subtasks are incomplete
- `due-date-warning`: Warn when subtask due date exceeds main task due date, offer auto-correction
- `subtask-template`: Include subtask templates in recurring task - when parent recurs, subtasks are auto-generated with dates calculated from parent's startDate
- `task-start-date`: Add startDate field to Task (required, defaults to creation timestamp)
- `task-duration`: Add duration/length parameter to recurring task template - dueDate calculated from startDate + duration

### Modified Capabilities

- `task-entity`: Add startDate field + dependency relationship methods
- `task-service`: Add dependency management methods to TaskService

## Impact

- New files: `TaskDependency.ts` domain model, `ITaskDependency.ts` interface, `ITaskDependencyRepository.ts` interface, `TaskDependencyRepository.ts` repository
- Modified files: 
  - `ITask.ts` - add startDate field
  - `Task.ts` - add startDate to domain model
  - `ITaskCreateDto.ts` - add startDate field
  - `ITaskUpdateDto.ts` - add startDate field
  - `TaskService.ts` - add dependency methods
  - `RecurrenceTemplate.ts` - add subtask templates with startDate offsets
- Database: New `TaskDependency` junction table with columns: `id`, `task_id`, `depends_on_task_id`, `dependency_type`, `created_at`, `updated_at`
- Tasks: Add `startDate` column (required, defaults to creation timestamp)
