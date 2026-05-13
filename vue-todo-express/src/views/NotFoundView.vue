<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const homeLink = computed(() => {
  return authStore.isAuthenticated ? { name: 'dashboard' } : { name: 'login' }
})

const homeLabel = computed(() => {
  return authStore.isAuthenticated ? 'Go to Dashboard' : 'Go to Login'
})

const goHome = () => {
  router.push(homeLink.value)
}
</script>

<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="not-found-icon">404</div>
      <h1 class="not-found-title">Page Not Found</h1>
      <p class="not-found-description">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button class="home-button" @click="goHome">
        {{ homeLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 2rem;
}

.not-found-content {
  text-align: center;
  max-width: 400px;
}

.not-found-icon {
  font-size: 6rem;
  font-weight: 800;
  color: var(--accent-primary);
  opacity: 0.3;
  line-height: 1;
  margin-bottom: 1rem;
}

.not-found-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.not-found-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 2rem;
}

.home-button {
  display: inline-block;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--bg-primary);
  background: var(--accent-primary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.home-button:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}
</style>
