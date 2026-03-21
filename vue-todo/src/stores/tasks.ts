/**
 * Tasks Pinia Store
 * Manages task state, filtering, sorting, and statistics
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  TaskSortOptions,
  TaskStatistics,
} from '@/types/task'
import type { Priority } from '@/types/priority'
import type { Category } from '@/types/category'
import taskService from '@/services/task.service'

export const useTasksStore = defineStore('tasks', () => {
  // State
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filter state
  const filters = ref<TaskFilters>({
    status: 'all',
    categoryId: null,
    priorityId: null,
  })

  // Sort state
  const sortOptions = ref<TaskSortOptions>({
    field: 'createdDt',
    order: 'desc',
  })

  // Related data
  const priorities = ref<Priority[]>([])
  const categories = ref<Category[]>([])

  // Getters
  const filteredTasks = computed(() => {
    let result = [...tasks.value]

    // Apply status filter
    if (filters.value.status === 'pending') {
      result = result.filter((task) => !task.isCompleted)
    } else if (filters.value.status === 'completed') {
      result = result.filter((task) => task.isCompleted)
    }

    // Apply category filter
    if (filters.value.categoryId) {
      result = result.filter((task) => task.todoCategoryId === filters.value.categoryId)
    }

    // Apply priority filter
    if (filters.value.priorityId) {
      result = result.filter((task) => task.todoPriorityId === filters.value.priorityId)
    }

    return result
  })

  const sortedTasks = computed(() => {
    const result = [...filteredTasks.value]
    const { field, order } = sortOptions.value
    const multiplier = order === 'asc' ? 1 : -1

    result.sort((a, b) => {
      switch (field) {
        case 'taskName':
          return multiplier * a.taskName.localeCompare(b.taskName)
        case 'dueDt':
          if (!a.dueDt && !b.dueDt) return 0
          if (!a.dueDt) return 1
          if (!b.dueDt) return -1
          return multiplier * (new Date(a.dueDt).getTime() - new Date(b.dueDt).getTime())
        case 'createdDt':
          return multiplier * (new Date(a.createdDt).getTime() - new Date(b.createdDt).getTime())
        case 'priority':
          return multiplier * (a.todoPriorityId || '').localeCompare(b.todoPriorityId || '')
        case 'category':
          return multiplier * (a.todoCategoryId || '').localeCompare(b.todoCategoryId || '')
        case 'taskSort':
          return multiplier * ((a.taskSort || 0) - (b.taskSort || 0))
        default:
          return 0
      }
    })

    return result
  })

  const statistics = computed<TaskStatistics>(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter((task) => task.isCompleted).length
    const pending = total - completed
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      pending,
      completed,
      completionPercentage,
    }
  })

  // Actions

  /**
   * Fetch all tasks from API
   */
  async function fetchTasks(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      tasks.value = await taskService.getAll()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tasks'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new task
   */
  async function createTask(data: CreateTaskDto): Promise<Task> {
    loading.value = true
    error.value = null

    try {
      const newTask = await taskService.create(data)
      tasks.value.push(newTask)
      return newTask
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create task'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing task
   */
  async function updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
    loading.value = true
    error.value = null

    try {
      const updatedTask = await taskService.update(id, data)
      const index = tasks.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
      return updatedTask
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update task'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a task
   */
  async function deleteTask(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await taskService.delete(id)
      tasks.value = tasks.value.filter((t) => t.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete task'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle task completion status (optimistic update)
   * API requires full TodoTask object due to additionalProperties: false
   */
  async function toggleTaskComplete(id: string): Promise<void> {
    const task = tasks.value.find((t) => t.id === id)
    if (!task) return

    // Optimistic update
    const originalStatus = task.isCompleted
    task.isCompleted = !originalStatus

    try {
      // Create updated task object with new completion status
      const updatedTask: Task = {
        ...task,
        isCompleted: !originalStatus,
      }
      await taskService.toggleComplete(updatedTask)
    } catch (err: unknown) {
      // Revert on error
      task.isCompleted = originalStatus
      error.value = err instanceof Error ? err.message : 'Failed to update task'
      throw err
    }
  }

  /**
   * Set filter options
   */
  function setFilters(newFilters: Partial<TaskFilters>): void {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * Reset filters to default
   */
  function resetFilters(): void {
    filters.value = {
      status: 'all',
      categoryId: null,
      priorityId: null,
    }
  }

  /**
   * Set sort options
   */
  function setSortOptions(options: TaskSortOptions): void {
    sortOptions.value = options
  }

  /**
   * Set priorities (from priorities store)
   */
  function setPriorities(priorityList: Priority[]): void {
    priorities.value = priorityList
  }

  /**
   * Set categories (from categories store)
   */
  function setCategories(categoryList: Category[]): void {
    categories.value = categoryList
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null
  }

  return {
    // State
    tasks,
    loading,
    error,
    filters,
    sortOptions,
    priorities,
    categories,

    // Getters
    filteredTasks,
    sortedTasks,
    statistics,

    // Actions
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    setFilters,
    resetFilters,
    setSortOptions,
    setPriorities,
    setCategories,
    clearError,
  }
})
