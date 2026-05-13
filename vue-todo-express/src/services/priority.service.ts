// Priority Service - API calls for TodoPriorities
import { api } from './api.service'
import type { Priority, CreatePriorityDto, UpdatePriorityDto } from '@/types/priority'

const PRIORITY_ENDPOINT = '/TodoPriorities'

export const priorityService = {
  /**
   * Get all priorities
   */
  async getAll(): Promise<Priority[]> {
    return api.get<Priority[]>(PRIORITY_ENDPOINT)
  },

  /**
   * Get priority by ID
   */
  async getById(id: string): Promise<Priority> {
    return api.get<Priority>(`${PRIORITY_ENDPOINT}/${id}`)
  },

  /**
   * Create a new priority
   */
  async create(data: CreatePriorityDto): Promise<Priority> {
    return api.post<Priority>(PRIORITY_ENDPOINT, data)
  },

  /**
   * Update an existing priority
   */
  async update(id: string, data: UpdatePriorityDto): Promise<Priority> {
    return api.put<Priority>(`${PRIORITY_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete a priority
   */
  async delete(id: string): Promise<void> {
    return api.delete<void>(`${PRIORITY_ENDPOINT}/${id}`)
  },
}

export default priorityService
