<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePrioritiesStore } from '@/stores/priorities'
import { useUIStore } from '@/stores/ui'
import PriorityForm from './PriorityForm.vue'
import type { Priority } from '@/types/priority'

const prioritiesStore = usePrioritiesStore()
const uiStore = useUIStore()

const showForm = ref(false)
const editingPriority = ref<Priority | null>(null)

onMounted(async () => {
  if (prioritiesStore.priorities.length === 0) {
    await prioritiesStore.fetchPriorities()
  }
})

const handleCreate = () => {
  editingPriority.value = null
  showForm.value = true
}

const handleEdit = (priority: Priority) => {
  editingPriority.value = priority
  showForm.value = true
}

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this priority?')) return

  try {
    await prioritiesStore.deletePriority(id)
    uiStore.showSuccess('Priority deleted')
  } catch {
    uiStore.showError('Failed to delete priority')
  }
}

const handleSaved = () => {
  showForm.value = false
  editingPriority.value = null
}

const handleClose = () => {
  showForm.value = false
  editingPriority.value = null
}
</script>

<template>
  <div class="priorities-list">
    <div class="list-header">
      <button class="create-btn" @click="handleCreate">+ Add Priority</button>
    </div>

    <div v-if="prioritiesStore.loading" class="loading">Loading...</div>

    <div v-else-if="prioritiesStore.priorities.length === 0" class="empty">
      <p>No priorities yet. Create your first priority!</p>
    </div>

    <div v-else class="list-items">
      <div v-for="priority in prioritiesStore.priorities" :key="priority.id" class="list-item">
        <div class="item-info">
          <span class="item-name">{{ priority.priorityName }}</span>
          <span class="item-sort">Order: {{ priority.prioritySort }}</span>
        </div>
        <div class="item-actions">
          <button class="edit-btn" @click="handleEdit(priority)" title="Edit">✏️</button>
          <button class="delete-btn" @click="handleDelete(priority.id)" title="Delete">🗑️</button>
        </div>
      </div>
    </div>

    <PriorityForm
      v-if="showForm"
      :priority="editingPriority"
      @close="handleClose"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.priorities-list {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.create-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--bg-primary);
  background: var(--accent-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.create-btn:hover {
  background: var(--accent-hover);
}

.loading,
.empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.list-items {
  max-height: 300px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.list-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-name {
  font-weight: 500;
  color: var(--text-primary);
}

.item-sort {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.edit-btn:hover,
.delete-btn:hover {
  opacity: 1;
}
</style>
