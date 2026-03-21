// Priority entity types - API aligned with App.Domain.Todo.TodoPriority

export interface Priority {
  id: string
  appUserId: string
  priorityName: string
  prioritySort: number
  syncDt: string
  tag?: string | null
}

// Priority creation DTO
export interface CreatePriorityDto {
  priorityName: string
  prioritySort: number
  tag?: string | null
}

// Priority update DTO
export interface UpdatePriorityDto {
  priorityName?: string
  prioritySort?: number
  tag?: string | null
}
