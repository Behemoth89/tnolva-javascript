## Why

Currently, recurring tasks are tightly coupled with the task system without a clear separation between the "recurring template" (the blueprint for recurring tasks) and the actual task instances generated from it. This makes it difficult for users to manage recurring schedules, view all their recurring tasks in one place, modify recurrence patterns, or stop recurrence without affecting already-generated tasks. Additionally, there's no built-in support for generating tasks in advance or running batch generation periodically.

## What Changes

- **NEW**: Create a dedicated `RecurringTask` table to store recurring task templates separately from task instances
- **NEW**: Allow users to specify a date range (start date, end date or indefinite) for recurring tasks
- **NEW**: Support interval-based task generation (daily, weekly, monthly, custom intervals)
- **NEW**: Implement advance task generation - system generates up to 1 year ahead or the next task if the interval exceeds 1 year
- **NEW**: Generate tasks when a recurring task is created or edited
- **NEW**: Add a batch generation utility that can be called from admin panel or scheduled monthly
- **NEW**: Track relationship between recurring task and generated task instances via junction table
- **NEW**: Junction table stores metadata: original generated date, last regenerated date, etc.
- **NEW**: When recurring task is modified:
  - Tasks NOT marked done → edit to match new configuration
  - If interval changed → regenerate future tasks
  - If recurrence stopped → delete future tasks
  - Tasks marked done → locked (cannot be deleted or modified)
- **MODIFIED**: Simplify the Task entity - remove recurrence-specific fields, making all tasks uniform regardless of origin

## Capabilities

### New Capabilities
- `recurring-task-table`: Dedicated storage for recurring task templates with date range and interval configuration
- `recurring-task-generator`: Generate task instances from recurring task templates based on interval and date range
- `recurring-task-junction`: Junction table to track task-recurring relationship with metadata (e.g., original generated date, last regenerated date)
- `recurring-task-sync`: Handle synchronization when recurring task is modified (update, regenerate, or delete future tasks)
- `recurring-task-management`: Service layer to manage recurring tasks (create, edit, stop, view all)
- `batch-recurring-generation`: Utility to generate all pending recurring tasks system-wide (for monthly admin execution)

### Modified Capabilities
- `task-entity`: Simplify task entity by removing recurrence-specific fields - all tasks are now simple task instances

## Impact

- **Impact**: Data layer (new tables), domain, service, batch utility
