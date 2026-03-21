/**
 * Sorting Composable
 * Provides sorting functionality for tasks
 */

import { computed } from 'vue'
import type { Task } from '@/types/task'
import type { TaskSortOptions, TaskSortField, SortOrder } from '@/types/task'

export function useSorting(
  tasks: ReturnType<typeof computed<Task[]>>,
  options: ReturnType<typeof computed<TaskSortOptions>>,
) {
  const sortFields: { value: TaskSortField; label: string }[] = [
    { value: 'createdDt', label: 'Created Date' },
    { value: 'dueDt', label: 'Due Date' },
    { value: 'taskName', label: 'Name' },
    { value: 'priority', label: 'Priority' },
    { value: 'category', label: 'Category' },
    { value: 'taskSort', label: 'Custom Order' },
  ]

  const sortOrders: { value: SortOrder; label: string }[] = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ]

  const currentSortField = computed(() => options.value.field)
  const currentSortOrder = computed(() => options.value.order)

  const sortedTasks = computed(() => {
    const result = [...tasks.value]
    const { field, order } = options.value
    const multiplier = order === 'asc' ? 1 : -1

    result.sort((a, b) => {
      switch (field) {
        case 'taskName':
          return multiplier * a.taskName.localeCompare(b.taskName)
        case 'dueDt': {
          if (!a.dueDt && !b.dueDt) return 0
          if (!a.dueDt) return 1
          if (!b.dueDt) return -1
          return multiplier * (new Date(a.dueDt).getTime() - new Date(b.dueDt).getTime())
        }
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

  return {
    sortFields,
    sortOrders,
    currentSortField,
    currentSortOrder,
    sortedTasks,
  }
}
