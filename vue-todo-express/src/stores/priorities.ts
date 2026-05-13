/**
 * Priorities Pinia Store
 * Manages priority CRUD operations
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Priority, CreatePriorityDto, UpdatePriorityDto } from '@/types/priority'
import priorityService from '@/services/priority.service'

export const usePrioritiesStore = defineStore('priorities', () => {
  // State
  const priorities = ref<Priority[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions

  /**
   * Fetch all priorities from API
   */
  async function fetchPriorities(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      priorities.value = await priorityService.getAll()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch priorities'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new priority
   */
  async function createPriority(data: CreatePriorityDto): Promise<Priority> {
    loading.value = true
    error.value = null

    try {
      const newPriority = await priorityService.create(data)
      priorities.value.push(newPriority)
      return newPriority
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create priority'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing priority
   */
  async function updatePriority(id: string, data: UpdatePriorityDto): Promise<Priority> {
    loading.value = true
    error.value = null

    try {
      const updatedPriority = await priorityService.update(id, data)
      const index = priorities.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        priorities.value[index] = updatedPriority
      }
      return updatedPriority
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update priority'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a priority
   */
  async function deletePriority(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await priorityService.delete(id)
      priorities.value = priorities.value.filter((p) => p.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete priority'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get priority by ID
   */
  function getPriorityById(id: string): Priority | undefined {
    return priorities.value.find((p) => p.id === id)
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null
  }

  return {
    // State
    priorities,
    loading,
    error,

    // Actions
    fetchPriorities,
    createPriority,
    updatePriority,
    deletePriority,
    getPriorityById,
    clearError,
  }
})
