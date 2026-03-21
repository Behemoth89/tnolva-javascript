<script setup lang="ts">
defineProps<{
  count?: number
}>()
</script>

<template>
  <div class="skeleton-list">
    <div v-for="i in count || 5" :key="i" class="skeleton-card">
      <div class="skeleton-checkbox">
        <div class="skeleton-line small"></div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-header">
          <div class="skeleton-line medium"></div>
          <div class="skeleton-badges">
            <div class="skeleton-line small"></div>
            <div class="skeleton-line small"></div>
          </div>
        </div>
        <div class="skeleton-footer">
          <div class="skeleton-line small"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.skeleton-checkbox {
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.skeleton-badges {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--border-color) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-line.small {
  width: 60px;
  height: 16px;
}

.skeleton-line.medium {
  width: 180px;
  height: 20px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
