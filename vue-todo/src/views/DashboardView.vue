<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import UserDisplay from '@/components/auth/UserDisplay.vue'
import LogoutButton from '@/components/auth/LogoutButton.vue'

const authStore = useAuthStore()

onMounted(() => {
  // Setup storage listener for multi-tab sync
  authStore.setupStorageListener()
})

onUnmounted(() => {
  // Cleanup storage listener to prevent memory leaks
  authStore.removeStorageListener()
})
</script>

<template>
  <div class="dashboard-page">
    <header class="dashboard-header">
      <h1 class="dashboard-title">Dashboard</h1>
      <div class="dashboard-actions">
        <UserDisplay />
        <LogoutButton />
      </div>
    </header>

    <main class="dashboard-content">
      <div class="card welcome-card">
        <h2>Welcome to vue-todo!</h2>
        <p>Your authentication is set up successfully.</p>
        <p class="text-secondary">
          This is your protected dashboard area. You can only see this page when logged in.
        </p>
      </div>

      <div class="card">
        <h3>Getting Started</h3>
        <p class="text-secondary">Task management features will be available in the next phase.</p>
      </div>
    </main>
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

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.dashboard-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.dashboard-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.welcome-card {
  margin-bottom: 1.5rem;
}

.welcome-card h2 {
  margin: 0 0 0.5rem;
  color: var(--accent-primary);
}

.card h3 {
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}

.text-secondary {
  color: var(--text-secondary);
  margin: 0;
}
</style>
