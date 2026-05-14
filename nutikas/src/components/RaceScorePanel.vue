<script setup lang="ts">
/**
 * RaceScorePanel — collapsible post-race score breakdown
 * Per D-13/D-14: post-race summary shows detailed breakdown in collapsible cards.
 * Score as hero element at top, breakdown sections below that expand/collapse.
 */

import { ref, computed } from 'vue'
import { ElCollapse, ElCollapseItem } from 'element-plus'

const props = defineProps<{
  startDT: string | null
  finishDT: string | null
  score: number
  bonus: number
  penalty: number
  finalScore: number
}>()

// Track which sections are expanded
const activeNames = ref<string[]>([])

/**
 * Compute elapsed time from startDT and finishDT
 * Formatted as "HH:MM:SS" or "Xh Ym" per D-13
 */
const elapsedTime = computed((): string | null => {
  if (!props.startDT || !props.finishDT) return null

  const start = new Date(props.startDT)
  const finish = new Date(props.finishDT)
  const diffMs = finish.getTime() - start.getTime()

  if (diffMs < 0) return null

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

/**
 * Determine if the time section should be shown
 * Only relevant post-race (after finishDT is set)
 */
const showTimeSection = computed(() => props.finishDT !== null && elapsedTime.value !== null)
</script>

<template>
  <div class="race-score-panel">
    <!-- Hero: Final Score -->
    <div class="score-hero">
      <span class="final-score-value">{{ finalScore }}</span>
      <span class="final-score-label">Final Score</span>
    </div>

    <!-- Collapsible Breakdown Sections -->
    <ElCollapse v-model="activeNames" class="breakdown-collapse">
      <ElCollapseItem title="Score" name="score">
        <div class="breakdown-detail">
          <span class="detail-label">Base Score</span>
          <span class="detail-value">{{ score }}</span>
        </div>
      </ElCollapseItem>

      <ElCollapseItem title="Bonus" name="bonus">
        <div class="breakdown-detail bonus-detail">
          <span class="detail-label">Bonus Points</span>
          <span class="detail-value positive">+{{ bonus }}</span>
        </div>
      </ElCollapseItem>

      <ElCollapseItem title="Penalty" name="penalty">
        <div class="breakdown-detail penalty-detail">
          <span class="detail-label">Penalty Points</span>
          <span class="detail-value negative">-{{ penalty }}</span>
        </div>
      </ElCollapseItem>

      <ElCollapseItem v-if="showTimeSection" title="Time" name="time">
        <div class="breakdown-detail time-detail">
          <span class="detail-label">Elapsed Time</span>
          <span class="detail-value">{{ elapsedTime }}</span>
        </div>
      </ElCollapseItem>
    </ElCollapse>
  </div>
</template>

<style scoped>
.race-score-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

.score-hero {
  text-align: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 1rem;
}

.final-score-value {
  display: block;
  font-size: 4rem;
  font-weight: 700;
  color: #1976d2;
  line-height: 1;
}

.final-score-label {
  display: block;
  font-size: 0.875rem;
  color: #999;
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.breakdown-collapse {
  border: none;
}

:deep(.el-collapse-item__header) {
  font-weight: 600;
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.el-collapse-item__wrap) {
  border: none;
}

:deep(.el-collapse-item__content) {
  padding-top: 0.5rem;
}

.breakdown-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.detail-label {
  font-size: 0.875rem;
  color: #666;
}

.detail-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
}

.detail-value.positive {
  color: #2e7d32;
}

.detail-value.negative {
  color: #c62828;
}

.bonus-detail {
  background: #f0f7ff;
}

.penalty-detail {
  background: #fff5f5;
}

.time-detail {
  background: #f5f5f5;
}
</style>