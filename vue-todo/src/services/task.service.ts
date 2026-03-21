// Task Service - API calls for TodoTasks
import { api } from './api.service'
import type { Task, CreateTaskDto, UpdateTaskDto } from '@/types/task'

const TASK_ENDPOINT = '/TodoTasks'

export const taskService = {
  /**
   * Get all tasks
   */
  async getAll(): Promise<Task[]> {
    return api.get<Task[]>(TASK_ENDPOINT)
  },

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<Task> {
    return api.get<Task>(`${TASK_ENDPOINT}/${id}`)
  },

  /**
   * Create a new task
   */
  async create(data: CreateTaskDto): Promise<Task> {
    return api.post<Task>(TASK_ENDPOINT, data)
  },

  /**
   * Update an existing task
   */
  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    return api.put<Task>(`${TASK_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    return api.delete<void>(`${TASK_ENDPOINT}/${id}`)
  },

  /**
   * Toggle task completion status
   * API requires full TodoTask object due to additionalProperties: false
   */
  async toggleComplete(task: Task): Promise<Task> {
    return api.put<Task>(`${TASK_ENDPOINT}/${task.id}`, task)
  },
}

export default taskService
