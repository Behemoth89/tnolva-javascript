<script setup lang="ts">
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
</script>

<template>
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
</template>

<style scoped>
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
