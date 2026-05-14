<script setup lang="ts">
import { computed } from 'vue'

interface Position {
  ordinal: number
  total: number
}

const props = defineProps<{
  score: number
  bonus: number
  penalty: number
  finalScore: number
  position: Position | null
  contestId: string
  userTeamId: string
  contestClassId: string
  isLoading: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

/**
 * Convert numeric position to ordinal word
 * 1 -> 1st, 2 -> 2nd, 3 -> 3rd, etc.
 */
function toOrdinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}



/**
 * Handle refresh button click
 * Emits refresh event for manual score refresh (D-08)
 */
function handleRefresh() {
  emit('refresh')
}

// Display values
const displayPosition = computed(() => {
  if (!props.position) return null
  return {
    ordinal: toOrdinal(props.position.ordinal),
    total: props.position.total
  }
})
</script>

<template>
  <div class="score-card">
    <header class="score-header">
      <h3 class="score-title">Score</h3>
      <button
        class="refresh-btn"
        @click="handleRefresh"
        :disabled="isLoading"
        aria-label="Refresh score"
      >
        <span v-if="isLoading" class="spinner">⟳</span>
        <span v-else>⟳</span>
      </button>
    </header>

    <div class="score-hero">
      <span class="final-score-value">{{ finalScore }}</span>
      <span class="final-score-label">Final Score</span>
    </div>

    <div class="score-breakdown">
      <div class="breakdown-row">
        <span class="breakdown-label">Base Score</span>
        <span class="breakdown-value">{{ score }}</span>
      </div>
      <div class="breakdown-row bonus">
        <span class="breakdown-label">Bonus</span>
        <span class="breakdown-value positive">+{{ bonus }}</span>
      </div>
      <div class="breakdown-row penalty">
        <span class="breakdown-label">Penalty</span>
        <span class="breakdown-value negative">-{{ penalty }}</span>
      </div>
    </div>

    <div v-if="displayPosition" class="position-display">
      <span class="position-label">Position:</span>
      <span class="position-value">{{ displayPosition.ordinal }} of {{ displayPosition.total }}</span>
    </div>
    <div v-else class="position-display">
      <span class="position-label">Position:</span>
      <span class="position-value empty">--</span>
    </div>
  </div>
</template>

<style scoped>
.score-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.score-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.refresh-btn {
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 1.25rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #1976d2;
  color: white;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.score-hero {
  text-align: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 0.75rem;
}

.final-score-value {
  display: block;
  font-size: 3rem;
  font-weight: 700;
  color: #1976d2;
  line-height: 1;
}

.final-score-label {
  display: block;
  font-size: 0.875rem;
  color: #999;
  margin-top: 0.25rem;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.breakdown-label {
  color: #666;
}

.breakdown-value {
  font-weight: 600;
  color: #333;
}

.breakdown-value.positive {
  color: #2e7d32;
}

.breakdown-value.negative {
  color: #c62828;
}

.position-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #eee;
}

.position-label {
  font-size: 0.875rem;
  color: #666;
}

.position-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1976d2;
}

.position-value.empty {
  color: #bbb;
}
</style>