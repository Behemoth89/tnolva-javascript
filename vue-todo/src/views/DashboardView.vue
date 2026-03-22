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
      <div class="header-left">
        <h1 class="dashboard-title">Task Dashboard</h1>
      </div>
      <div class="dashboard-actions">
        <button class="settings-btn" @click="goToSettings" title="Settings">⚙️</button>
        <UserDisplay />
        <LogoutButton />
      </div>
    </header>

    <main class="dashboard-content">
      <!-- Create Task Button -->
      <button class="create-task-btn" @click="handleCreateTask">+ Create New Task</button>

      <!-- Statistics -->
      <StatisticsCard :statistics="tasksStore.statistics" class="stats-section" />

      <!-- Sort and Filter Bar -->
      <div class="controls-bar">
        <TaskFilters />
        <TaskSort />
      </div>

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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.dashboard-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.dashboard-content {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.create-task-btn {
  display: inline-block;
  width: 100%;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--bg-primary);
  background: var(--accent-primary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-task-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}

.stats-section {
  margin-bottom: 1.5rem;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.task-list-container {
  min-height: 200px;
}
</style>
