// Task Service - API calls for TodoTasks
import { api, ApiError } from './api.service'
import type { Task, CreateTaskDto, UpdateTaskDto } from '@/types/task'

const TASK_ENDPOINT = '/TodoTasks'

/**
 * Retry wrapper with exponential backoff for transient errors
 * Only retries on 5xx server errors, not 4xx client errors
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 300,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err

      // Don't retry on client errors (4xx) or on last attempt
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err
      }
      if (attempt === maxRetries) {
        throw err
      }

      // Exponential backoff: baseDelay * 2^attempt
      const delay = baseDelayMs * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

export const taskService = {
  /**
   * Get all tasks
   */
  async getAll(): Promise<Task[]> {
    return withRetry(() => api.get<Task[]>(TASK_ENDPOINT) as Promise<Task[]>)
  },

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<Task> {
    return withRetry(() => api.get<Task>(`${TASK_ENDPOINT}/${id}`) as Promise<Task>)
  },

  /**
   * Create a new task
   */
  async create(data: CreateTaskDto): Promise<Task> {
    return withRetry(() => api.post<Task>(TASK_ENDPOINT, data) as Promise<Task>)
  },

  /**
   * Update an existing task
   */
  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    return withRetry(() => api.put<Task>(`${TASK_ENDPOINT}/${id}`, data) as Promise<Task>)
  },

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    return withRetry(() => api.delete<void>(`${TASK_ENDPOINT}/${id}`) as Promise<void>)
  },

  /**
   * Toggle task completion status
   * API requires full TodoTask object due to additionalProperties: false
   */
  async toggleComplete(task: Task): Promise<Task> {
    return withRetry(() => api.put<Task>(`${TASK_ENDPOINT}/${task.id}`, task) as Promise<Task>)
  },
}

export default taskService
