<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePrioritiesStore } from '@/stores/priorities'
import { useUIStore } from '@/stores/ui'
import type { Priority, CreatePriorityDto } from '@/types/priority'

const props = defineProps<{
  priority?: Priority | null
}>()

const emit = defineEmits<{
  close: []
  saved: [priority: Priority]
}>()

const prioritiesStore = usePrioritiesStore()
const uiStore = useUIStore()

const isEditing = !!props.priority

const formData = ref<CreatePriorityDto>({
  priorityName: '',
  prioritySort: 0,
})

watch(
  () => props.priority,
  (newPriority) => {
    if (newPriority) {
      formData.value = {
        priorityName: newPriority.priorityName,
        prioritySort: newPriority.prioritySort,
      }
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  if (!formData.value.priorityName.trim()) {
    uiStore.showError('Priority name is required')
    return
  }

  try {
    let result: Priority

    if (isEditing && props.priority) {
      // API requires full object with all fields for PUT request
      const updateData = {
        id: props.priority.id,
        appUserId: props.priority.appUserId,
        priorityName: formData.value.priorityName,
        prioritySort: formData.value.prioritySort,
        syncDt: props.priority.syncDt,
        tag: props.priority.tag ?? null,
      }
      result = await prioritiesStore.updatePriority(props.priority.id, updateData)
      uiStore.showSuccess('Priority updated')
    } else {
      formData.value.prioritySort = prioritiesStore.priorities.length
      result = await prioritiesStore.createPriority(formData.value)
      uiStore.showSuccess('Priority created')
    }

    emit('saved', result)
    emit('close')
  } catch {
    uiStore.showError(isEditing ? 'Failed to update priority' : 'Failed to create priority')
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="priority-form-overlay" @click.self="handleClose">
    <div class="priority-form">
      <div class="form-header">
        <h2>{{ isEditing ? 'Edit Priority' : 'Create New Priority' }}</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="priorityName">Priority Name *</label>
          <input
            id="priorityName"
            v-model="formData.priorityName"
            type="text"
            class="form-input"
            placeholder="Enter priority name"
            maxlength="128"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="prioritySort">Sort Order</label>
          <input
            id="prioritySort"
            v-model.number="formData.prioritySort"
            type="number"
            class="form-input"
            min="0"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="handleClose">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="prioritiesStore.loading">
            {{ prioritiesStore.loading ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.priority-form-overlay {
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

.priority-form {
  width: 100%;
  max-width: 400px;
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

.form-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
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
