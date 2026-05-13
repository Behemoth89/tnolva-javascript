<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { usePrioritiesStore } from '@/stores/priorities'

import { useUIStore } from '@/stores/ui'
import CategorySelect from './CategorySelect.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import type { Task, CreateTaskDto } from '@/types/task'

const props = defineProps<{
  task?: Task | null
}>()

const emit = defineEmits<{
  close: []
  saved: [task: Task]
}>()

const tasksStore = useTasksStore()
const prioritiesStore = usePrioritiesStore()
const uiStore = useUIStore()

const isEditing = computed(() => !!props.task)

const formData = ref<{
  taskName: string
  dueDt: string | null
  todoCategoryId: string | null
  todoPriorityId: string | null
}>({
  taskName: '',
  dueDt: null,
  todoCategoryId: null,
  todoPriorityId: null,
})

watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      formData.value = {
        taskName: newTask.taskName,
        dueDt: newTask.dueDt,
        todoCategoryId: newTask.todoCategoryId,
        todoPriorityId: newTask.todoPriorityId,
      }
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  if (!formData.value.taskName.trim()) {
    uiStore.showError('Task name is required')
    return
  }

  if (!formData.value.todoPriorityId) {
    uiStore.showError('Priority is required')
    return
  }

  if (!formData.value.todoCategoryId) {
    uiStore.showError('Category is required')
    return
  }

  try {
    let result: Task

    if (isEditing.value && props.task) {
      // API requires full object with all fields for PUT request
      const updateData = {
        id: props.task.id,
        taskName: formData.value.taskName,
        taskSort: props.task.taskSort,
        createdDt: props.task.createdDt,
        dueDt: formData.value.dueDt,
        isCompleted: props.task.isCompleted,
        isArchived: props.task.isArchived,
        todoCategoryId: formData.value.todoCategoryId,
        todoPriorityId: formData.value.todoPriorityId,
        syncDt: props.task.syncDt,
      }
      result = await tasksStore.updateTask(props.task.id, updateData)
      uiStore.showSuccess('Task updated')
    } else {
      const now = new Date().toISOString()
      // Build request object - only include fields with values
      // API has additionalProperties: false and non-nullable UUID fields
      const createData: Record<string, unknown> = {
        taskName: formData.value.taskName,
        createdDt: now,
        isCompleted: false,
        isArchived: false,
        syncDt: now,
      }
      if (formData.value.dueDt) {
        createData.dueDt = formData.value.dueDt
      }
      if (formData.value.todoCategoryId) {
        createData.todoCategoryId = formData.value.todoCategoryId
      }
      if (formData.value.todoPriorityId) {
        createData.todoPriorityId = formData.value.todoPriorityId
      }
      result = await tasksStore.createTask(createData as unknown as CreateTaskDto)
      uiStore.showSuccess('Task created')
    }

    emit('saved', result)
    emit('close')
  } catch {
    uiStore.showError(isEditing.value ? 'Failed to update task' : 'Failed to create task')
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="task-form-overlay" @click.self="handleClose">
    <div class="task-form">
      <div class="form-header">
        <h2>{{ isEditing ? 'Edit Task' : 'Create New Task' }}</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="taskName">Task Name *</label>
          <input
            id="taskName"
            v-model="formData.taskName"
            type="text"
            class="form-input"
            placeholder="Enter task name"
            maxlength="128"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Due Date</label>
          <DatePicker v-model="formData.dueDt" />
        </div>

        <div class="form-group">
          <label class="form-label">Priority *</label>
          <select v-model="formData.todoPriorityId" class="form-select" required>
            <option :value="null" disabled>Select a priority</option>
            <option
              v-for="priority in prioritiesStore.priorities"
              :key="priority.id"
              :value="priority.id"
            >
              {{ priority.priorityName }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Category *</label>
          <CategorySelect v-model="formData.todoCategoryId" required />
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="handleClose">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="tasksStore.loading">
            {{ tasksStore.loading ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.task-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.task-form {
  width: 100%;
  max-width: 500px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.form-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-input::placeholder {
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
</style>
