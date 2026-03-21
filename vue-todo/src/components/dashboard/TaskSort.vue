<script setup lang="ts">
import { computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import type { TaskSortField, SortOrder } from '@/types/task'

const tasksStore = useTasksStore()

const sortFields: { value: TaskSortField; label: string }[] = [
  { value: 'createdDt', label: 'Created Date' },
  { value: 'dueDt', label: 'Due Date' },
  { value: 'taskName', label: 'Name' },
  { value: 'priority', label: 'Priority' },
  { value: 'category', label: 'Category' },
]

const sortOrders: { value: SortOrder; label: string }[] = [
  { value: 'asc', label: '↑' },
  { value: 'desc', label: '↓' },
]

const currentField = computed({
  get: () => tasksStore.sortOptions.field,
  set: (value: TaskSortField) => {
    tasksStore.setSortOptions({ ...tasksStore.sortOptions, field: value })
  },
})

const currentOrder = computed({
  get: () => tasksStore.sortOptions.order,
  set: (value: SortOrder) => {
    tasksStore.setSortOptions({ ...tasksStore.sortOptions, order: value })
  },
})
</script>

<template>
  <div class="task-sort">
    <label class="sort-label">Sort by:</label>
    <select v-model="currentField" class="sort-select">
      <option v-for="field in sortFields" :key="field.value" :value="field.value">
        {{ field.label }}
      </option>
    </select>
    <select v-model="currentOrder" class="sort-select order-select">
      <option v-for="order in sortOrders" :key="order.value" :value="order.value">
        {{ order.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.task-sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.sort-select {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.sort-select:hover {
  border-color: var(--accent-primary);
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.order-select {
  width: 60px;
  text-align: center;
}
</style>
