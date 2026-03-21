<script setup lang="ts">
import { computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { usePrioritiesStore } from '@/stores/priorities'
import { useCategoriesStore } from '@/stores/categories'
import type { TaskFilters as TaskFiltersType } from '@/types/task'

const tasksStore = useTasksStore()
const prioritiesStore = usePrioritiesStore()
const categoriesStore = useCategoriesStore()

const statusOptions: { value: TaskFiltersType['status']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

const currentStatus = computed({
  get: () => tasksStore.filters.status,
  set: (value: TaskFiltersType['status']) => {
    tasksStore.setFilters({ status: value })
  },
})

const currentCategoryId = computed({
  get: () => tasksStore.filters.categoryId,
  set: (value: string | null) => {
    tasksStore.setFilters({ categoryId: value })
  },
})

const currentPriorityId = computed({
  get: () => tasksStore.filters.priorityId,
  set: (value: string | null) => {
    tasksStore.setFilters({ priorityId: value })
  },
})

const hasActiveFilters = computed(() => {
  return (
    tasksStore.filters.status !== 'all' ||
    tasksStore.filters.categoryId !== null ||
    tasksStore.filters.priorityId !== null
  )
})

const resetFilters = () => {
  tasksStore.resetFilters()
}
</script>

<template>
  <div class="task-filters">
    <div class="filter-group">
      <label class="filter-label">Status:</label>
      <select v-model="currentStatus" class="filter-select">
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label">Category:</label>
      <select v-model="currentCategoryId" class="filter-select">
        <option :value="null">All Categories</option>
        <option
          v-for="category in categoriesStore.categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.categoryName }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label">Priority:</label>
      <select v-model="currentPriorityId" class="filter-select">
        <option :value="null">All Priorities</option>
        <option
          v-for="priority in prioritiesStore.priorities"
          :key="priority.id"
          :value="priority.id"
        >
          {{ priority.priorityName }}
        </option>
      </select>
    </div>

    <button v-if="hasActiveFilters" class="reset-btn" @click="resetFilters" title="Reset filters">
      Clear Filters
    </button>
  </div>
</template>

<style scoped>
.task-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  min-width: 140px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:hover {
  border-color: var(--accent-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.reset-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  color: var(--color-error);
  border-color: var(--color-error);
}
</style>
