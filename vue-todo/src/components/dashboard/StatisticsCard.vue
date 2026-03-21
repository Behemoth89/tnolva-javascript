<script setup lang="ts">
import { computed } from 'vue'
import type { TaskStatistics } from '@/types/task'

const props = defineProps<{
  statistics: TaskStatistics
}>()

const completionStyle = computed(() => {
  const percentage = props.statistics.completionPercentage
  return {
    width: `${percentage}%`,
  }
})
</script>

<template>
  <div class="statistics-card">
    <div class="stat-item">
      <span class="stat-value">{{ statistics.total }}</span>
      <span class="stat-label">Total</span>
    </div>
    <div class="stat-item">
      <span class="stat-value pending">{{ statistics.pending }}</span>
      <span class="stat-label">Pending</span>
    </div>
    <div class="stat-item">
      <span class="stat-value completed">{{ statistics.completed }}</span>
      <span class="stat-label">Completed</span>
    </div>
    <div class="stat-item progress-item">
      <div class="progress-header">
        <span class="stat-value">{{ statistics.completionPercentage }}%</span>
        <span class="stat-label">Done</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="completionStyle"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statistics-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-primary);
}

.stat-value.pending {
  color: var(--color-warning);
}

.stat-value.completed {
  color: var(--color-success);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.progress-item {
  flex: 1;
  max-width: 200px;
}

.progress-header {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-hover));
  border-radius: 4px;
  transition: width 0.3s ease;
}
</style>
