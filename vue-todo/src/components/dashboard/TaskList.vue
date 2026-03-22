<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types/task'
import type { Priority } from '@/types/priority'
import type { Category } from '@/types/category'
import TaskCard from './TaskCard.vue'
import SkeletonLoader from './SkeletonLoader.vue'

const props = defineProps<{
  tasks: Task[]
  priorities: Priority[]
  categories: Category[]
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  toggleComplete: [id: string]
  delete: [id: string]
  edit: [task: Task]
  retry: []
}>()

const priorityMap = computed(() => new Map(props.priorities.map((p) => [p.id, p])))
const categoryMap = computed(() => new Map(props.categories.map((c) => [c.id, c])))

const getPriority = (id: string | null): Priority | null => {
  if (!id) return null
  return priorityMap.value.get(id) ?? null
}

const getCategory = (id: string | null): Category | null => {
  if (!id) return null
  return categoryMap.value.get(id) ?? null
}
</script>

<template>
  <div class="task-list">
    <!-- Loading State -->
    <template v-if="loading">
      <SkeletonLoader :count="5" />
    </template>

    <!-- Error State -->
    <template v-else-if="error">
      <div class="error-state">
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="emit('retry')">Retry</button>
      </div>
    </template>

    <!-- Empty State -->
    <template v-else-if="tasks.length === 0">
      <div class="empty-state">
        <p class="empty-message">No tasks found.</p>
        <p class="empty-hint">Create your first task to get started!</p>
      </div>
    </template>

    <!-- Task List -->
    <template v-else>
      <TransitionGroup name="task-list" tag="div" class="tasks-container">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :priority="getPriority(task.todoPriorityId)"
          :category="getCategory(task.todoCategoryId)"
          @toggle-complete="emit('toggleComplete', $event)"
          @delete="emit('delete', $event)"
          @edit="emit('edit', $event)"
        />
      </TransitionGroup>
    </template>
  </div>
</template>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.error-message {
  color: var(--color-error);
  margin: 0 0 1rem;
}

.retry-btn {
  padding: 0.5rem 1.5rem;
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: var(--accent-hover);
}

.empty-message {
  color: var(--text-primary);
  font-size: 1.125rem;
  margin: 0 0 0.5rem;
}

.empty-hint {
  color: var(--text-secondary);
  margin: 0;
}

/* Transition animations */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from,
.task-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.task-list-move {
  transition: transform 0.3s ease;
}
</style>
