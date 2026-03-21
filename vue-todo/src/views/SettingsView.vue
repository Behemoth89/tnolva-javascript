<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import UserDisplay from '@/components/auth/UserDisplay.vue'
import LogoutButton from '@/components/auth/LogoutButton.vue'
import PrioritiesList from '@/components/settings/PrioritiesList.vue'
import CategoriesList from '@/components/settings/CategoriesList.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

onMounted(() => {
  authStore.setupStorageListener()
})

onUnmounted(() => {
  authStore.removeStorageListener()
})

const goToDashboard = () => {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="settings-page">
    <header class="settings-header">
      <div class="header-left">
        <button class="back-button" @click="goToDashboard" title="Back to Dashboard">
          <span class="back-icon">←</span>
        </button>
        <h1 class="settings-title">Settings</h1>
      </div>
      <div class="settings-actions">
        <UserDisplay />
        <LogoutButton />
      </div>
    </header>

    <main class="settings-content">
      <section class="settings-section">
        <h2 class="section-title">Priorities</h2>
        <PrioritiesList />
      </section>

      <section class="settings-section">
        <h2 class="section-title">Categories</h2>
        <CategoriesList />
      </section>
    </main>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.settings-header {
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

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.back-icon {
  font-size: 1.25rem;
  color: var(--text-primary);
}

.settings-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.settings-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.settings-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

/* Toast styles */
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
}

.toast {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  animation: slideIn 0.3s ease;
}

.toast-success {
  background: var(--color-success);
  color: white;
}

.toast-error {
  background: var(--color-error);
  color: white;
}

.toast-warning {
  background: var(--color-warning);
  color: var(--bg-primary);
}

.toast-info {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
