<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types/task'
import type { Priority } from '@/types/priority'
import type { Category } from '@/types/category'

const props = defineProps<{
  task: Task
  priority?: Priority | null
  category?: Category | null
}>()

const emit = defineEmits<{
  toggleComplete: [id: string]
  delete: [id: string]
  edit: [task: Task]
}>()

const formattedDueDate = computed(() => {
  if (!props.task.dueDt) return null

  const date = new Date(props.task.dueDt)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})

const isOverdue = computed(() => {
  if (!props.task.dueDt || props.task.isCompleted) return false
  return new Date(props.task.dueDt) < new Date()
})

const handleToggleComplete = () => {
  emit('toggleComplete', props.task.id)
}

const handleDelete = () => {
  emit('delete', props.task.id)
}

const handleEdit = () => {
  emit('edit', props.task)
}
</script>

<template>
  <div class="task-card" :class="{ 'is-completed': task.isCompleted, 'is-overdue': isOverdue }">
    <div class="task-checkbox">
      <input
        type="checkbox"
        :checked="task.isCompleted"
        @change="handleToggleComplete"
        :id="`task-${task.id}`"
      />
      <label :for="`task-${task.id}`" class="checkbox-custom"></label>
    </div>

    <div class="task-content" @click="handleEdit">
      <div class="task-header">
        <h3 class="task-title" :class="{ completed: task.isCompleted }">{{ task.taskName }}</h3>
        <div class="task-meta">
          <span
            v-if="priority"
            class="priority-badge"
            :style="{ borderColor: priority.tag || '#666' }"
          >
            {{ priority.priorityName }}
          </span>
          <span v-if="category" class="category-badge">
            {{ category.categoryName }}
          </span>
        </div>
      </div>

      <div class="task-footer">
        <span class="task-date" :class="{ overdue: isOverdue }">
          <span v-if="formattedDueDate">📅 {{ formattedDueDate }}</span>
          <span v-else class="no-date">No due date</span>
        </span>
        <button class="delete-btn" @click.stop="handleDelete" title="Delete task">🗑️</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.task-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-card.is-completed {
  opacity: 0.7;
}

.task-card.is-overdue {
  border-left: 3px solid var(--color-error);
}

.task-checkbox {
  position: relative;
  flex-shrink: 0;
}

.task-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  display: block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-checkbox input:checked + .checkbox-custom {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.task-checkbox input:checked + .checkbox-custom::after {
  content: '✓';
  display: block;
  text-align: center;
  color: var(--bg-primary);
  font-size: 14px;
  line-height: 16px;
}

.task-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.task-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  word-break: break-word;
}

.task-title.completed {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.task-meta {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.priority-badge,
.category-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 4px;
  background: var(--bg-tertiary);
}

.priority-badge {
  border-left: 3px solid;
}

.category-badge {
  color: var(--text-secondary);
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.task-date.overdue {
  color: var(--color-error);
}

.no-date {
  opacity: 0.5;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  padding: 0.25rem;
}

.task-card:hover .delete-btn {
  opacity: 0.6;
}

.delete-btn:hover {
  opacity: 1;
}
</style>
