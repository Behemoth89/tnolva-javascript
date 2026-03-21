// Task entity types - API aligned with App.Domain.Todo.TodoTask

import type { Category } from './category'
import type { Priority } from './priority'

export interface Task {
  id: string
  taskName: string
  taskSort: number | null
  createdDt: string
  dueDt: string | null
  isCompleted: boolean
  isArchived: boolean
  todoCategoryId: string | null
  todoPriorityId: string | null
  syncDt: string
}

// Extended task type with populated relations
export interface TaskWithRelations extends Task {
  category?: Category | null
  priority?: Priority | null
}

// Task creation DTO
export interface CreateTaskDto {
  taskName: string
  taskSort?: number
  dueDt?: string | null
  isCompleted?: boolean
  isArchived?: boolean
  todoCategoryId?: string | null
  todoPriorityId?: string | null
}

// Task update DTO
export interface UpdateTaskDto {
  taskName?: string
  taskSort?: number | null
  dueDt?: string | null
  isCompleted?: boolean
  isArchived?: boolean
  todoCategoryId?: string | null
  todoPriorityId?: string | null
}

// Task filter options
export interface TaskFilters {
  status: 'all' | 'pending' | 'completed'
  categoryId: string | null
  priorityId: string | null
}

// Task sort options
export type TaskSortField =
  | 'priority'
  | 'dueDt'
  | 'category'
  | 'createdDt'
  | 'taskName'
  | 'taskSort'
export type SortOrder = 'asc' | 'desc'

export interface TaskSortOptions {
  field: TaskSortField
  order: SortOrder
}

// Pagination
export interface TaskPagination {
  page: number
  pageSize: number
  hasMore: boolean
}

// Task statistics
export interface TaskStatistics {
  total: number
  pending: number
  completed: number
  completionPercentage: number
}
