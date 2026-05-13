<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { usePrioritiesStore } from '@/stores/priorities'
import { useCategoriesStore } from '@/stores/categories'
import { useUIStore } from '@/stores/ui'
import { useStorageListener } from '@/composables/useStorageListener'
import UserDisplay from '@/components/auth/UserDisplay.vue'
import LogoutButton from '@/components/auth/LogoutButton.vue'
import TaskList from '@/components/dashboard/TaskList.vue'
import TaskSort from '@/components/dashboard/TaskSort.vue'
import TaskFilters from '@/components/dashboard/TaskFilters.vue'
import TaskForm from '@/components/dashboard/TaskForm.vue'
import StatisticsCard from '@/components/dashboard/StatisticsCard.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import type { Task } from '@/types/task'

const router = useRouter()
const authStore = useAuthStore()
const tasksStore = useTasksStore()
const prioritiesStore = usePrioritiesStore()
const categoriesStore = useCategoriesStore()
const uiStore = useUIStore()

const showTaskForm = ref(false)
const editingTask = ref<Task | null>(null)

onMounted(async () => {
  await loadData()
})

useStorageListener(authStore.handleStorageEvent)

const loadData = async () => {
  try {
    await Promise.all([
      tasksStore.fetchTasks(),
      prioritiesStore.fetchPriorities(),
      categoriesStore.fetchCategories(),
    ])

    // Sync priorities and categories to tasks store
    tasksStore.setPriorities(prioritiesStore.priorities)
    tasksStore.setCategories(categoriesStore.categories)
  } catch (err: unknown) {
    uiStore.showError(err instanceof Error ? err.message : 'Failed to load data. Please try again.')
  }
}

const handleToggleComplete = async (id: string) => {
  try {
    await tasksStore.toggleTaskComplete(id)
    uiStore.showSuccess('Task updated')
  } catch (err: unknown) {
    uiStore.showError(err instanceof Error ? err.message : 'Failed to update task')
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this task?')) return

  try {
    await tasksStore.deleteTask(id)
    uiStore.showSuccess('Task deleted')
  } catch (err: unknown) {
    uiStore.showError(err instanceof Error ? err.message : 'Failed to delete task')
  }
}

const handleEdit = (task: Task) => {
  editingTask.value = task
  showTaskForm.value = true
}

const handleCreateTask = () => {
  editingTask.value = null
  showTaskForm.value = true
}

const handleTaskSaved = () => {
  // Task list will automatically update via store
}

const handleCloseTaskForm = () => {
  showTaskForm.value = false
  editingTask.value = null
}

const goToSettings = () => {
  router.push({ name: 'settings' })
}
</script>

<template>
  <div class="dashboard-page">
    <header class="dashboard-header">
      <div class="header-top">
        <div class="header-left">
          <h1 class="dashboard-title">Task Dashboard</h1>
          <button class="create-task-btn" @click="handleCreateTask">+ New Task</button>
        </div>
        <div class="header-center">
          <StatisticsCard :statistics="tasksStore.statistics" />
        </div>
        <div class="dashboard-actions">
          <button class="settings-btn" @click="goToSettings" title="Settings">⚙️</button>
          <UserDisplay />
          <LogoutButton />
        </div>
      </div>
      <div class="header-bottom">
        <div class="controls-bar">
          <TaskFilters />
          <TaskSort />
        </div>
      </div>
    </header>

    <main class="dashboard-content">
      <!-- Task List -->
      <div class="task-list-container">
        <TaskList
          :tasks="tasksStore.sortedTasks"
          :priorities="prioritiesStore.priorities"
          :categories="categoriesStore.categories"
          :loading="tasksStore.loading"
          :error="tasksStore.error"
          @toggle-complete="handleToggleComplete"
          @delete="handleDelete"
          @edit="handleEdit"
          @retry="loadData"
        />
      </div>
    </main>

    <!-- Task Form Modal -->
    <KeepAlive :max="1">
      <TaskForm
        v-if="showTaskForm"
        :task="editingTask"
        @close="handleCloseTaskForm"
        @saved="handleTaskSaved"
      />
    </KeepAlive>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.dashboard-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dashboard-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

.create-task-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--bg-primary);
  background: var(--accent-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.create-task-btn:hover {
  background: var(--accent-hover);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.dashboard-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.header-bottom {
  padding: 0 1.5rem 0.75rem;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.dashboard-content {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.task-list-container {
  min-height: 200px;
}
</style>
