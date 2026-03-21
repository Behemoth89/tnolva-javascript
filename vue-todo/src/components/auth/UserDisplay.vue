<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const userDisplayName = computed(() => {
  if (!authStore.user) return 'User'

  if (authStore.user.firstName && authStore.user.lastName) {
    return `${authStore.user.firstName} ${authStore.user.lastName}`
  }

  if (authStore.user.firstName) {
    return authStore.user.firstName
  }

  return authStore.user.email
})

const userInitials = computed(() => {
  if (!authStore.user) return '?'

  const first = authStore.user.firstName?.[0] || ''
  const last = authStore.user.lastName?.[0] || ''

  if (first || last) {
    return (first + last).toUpperCase()
  }

  return authStore.user.email?.[0]?.toUpperCase() || '?'
})
</script>

<template>
  <div class="user-display">
    <div class="user-avatar">
      {{ userInitials }}
    </div>
    <div class="user-info">
      <span class="user-name">{{ userDisplayName }}</span>
      <span v-if="authStore.user?.email" class="user-email">{{ authStore.user.email }}</span>
    </div>
  </div>
</template>

<style scoped>
.user-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
</style>
