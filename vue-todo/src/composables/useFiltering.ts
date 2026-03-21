/**
 * Filtering Composable
 * Provides filtering functionality for tasks
 */

import { computed } from 'vue'
import type { Task } from '@/types/task'
import type { TaskFilters } from '@/types/task'

export function useFiltering(
  tasks: ReturnType<typeof computed<Task[]>>,
  filters: ReturnType<typeof computed<TaskFilters>>,
) {
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ]

  const currentStatus = computed(() => filters.value.status)
  const currentCategoryId = computed(() => filters.value.categoryId)
  const currentPriorityId = computed(() => filters.value.priorityId)

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

  const hasActiveFilters = computed(() => {
    return (
      filters.value.status !== 'all' ||
      filters.value.categoryId !== null ||
      filters.value.priorityId !== null
    )
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.status !== 'all') count++
    if (filters.value.categoryId) count++
    if (filters.value.priorityId) count++
    return count
  })

  return {
    statusOptions,
    currentStatus,
    currentCategoryId,
    currentPriorityId,
    filteredTasks,
    hasActiveFilters,
    activeFilterCount,
  }
}
