<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContestStore } from '@/stores/contest'

const route = useRoute()
const router = useRouter()
const store = useContestStore()

const contestId = route.params.contestId as string
const teamId = route.params.teamId as string

onMounted(async () => {
  await store.fetchTeamDetail(contestId, teamId)
})

// Format datetime for display
function formatDateTime(dt: string | null): string {
  if (!dt) return '-'
  try {
    return new Date(dt).toLocaleString()
  } catch {
    return dt
  }
}

// Navigate back to results
function goBack() {
  router.push(`/contests/${contestId}/results`)
}

// Team data shortcuts
const team = computed(() => store.currentTeamDetail)

// Check if markings are available
const hasMarkings = computed(() => {
  return team.value?.markings != null && team.value.markings.length > 0
})
</script>

<template>
  <div class="team-detail">
    <!-- Loading state -->
    <div v-if="store.loading" class="loading">
      <span>Loading team details...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="store.error" class="error">
      <p>{{ store.error }}</p>
      <button @click="store.fetchTeamDetail(contestId, teamId)">Retry</button>
    </div>

    <!-- Team content -->
    <template v-else-if="team">
      <!-- Header -->
      <header class="team-header">
        <button class="back-link" @click="goBack">← Back to Results</button>
        <h1>{{ team.name || 'Unnamed Team' }}</h1>
        <p class="team-class">{{ team.contestClassName || 'Unknown Class' }}</p>
      </header>

      <!-- Team info -->
      <section class="team-info">
        <div class="info-row">
          <span class="info-label">Members</span>
          <span class="info-value">{{ team.memberNames || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Class</span>
          <span class="info-value">{{ team.contestClassName || '-' }}</span>
        </div>
      </section>

      <!-- Time section -->
      <section class="time-section">
        <h2>Time</h2>
        <div class="time-grid">
          <div class="time-item">
            <span class="time-label">Start</span>
            <span class="time-value">{{ formatDateTime(team.startDT) }}</span>
          </div>
          <div class="time-item">
            <span class="time-label">Finish</span>
            <span class="time-value">{{ formatDateTime(team.finishDT) || 'In progress' }}</span>
          </div>
        </div>
      </section>

      <!-- Score breakdown -->
      <section class="score-section">
        <h2>Score Breakdown</h2>
        <div class="score-breakdown">
          <div class="score-row">
            <span class="score-label">Base Score</span>
            <span class="score-value">{{ team.score }}</span>
          </div>
          <div class="score-row">
            <span class="score-label">Bonus</span>
            <span class="score-value bonus">+{{ team.bonus }}</span>
          </div>
          <div class="score-row">
            <span class="score-label">Penalty</span>
            <span class="score-value penalty">-{{ team.penalty }}</span>
          </div>
          <div class="score-row final">
            <span class="score-label">Final Score</span>
            <span class="score-value">{{ team.finalScore }}</span>
          </div>
        </div>
      </section>

      <!-- Markings list -->
      <section class="markings-section">
        <h2>Checkpoint Markings</h2>
        <p class="markings-note">Markings visible after contest close</p>
        
        <div v-if="hasMarkings" class="markings-list">
          <div
            v-for="marking in team.markings"
            :key="marking.id"
            class="marking-item"
          >
            <div class="marking-main">
              <span class="marking-cp">{{ marking.checkPointCPCode || marking.checkPointCPID || 'CP' }}</span>
              <span class="marking-datetime">{{ formatDateTime(marking.dt) }}</span>
            </div>
            <div class="marking-score">+{{ marking.score }}</div>
          </div>
        </div>
        
        <div v-else class="markings-empty">
          <p>No markings yet.</p>
        </div>
      </section>
    </template>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>Team not found.</p>
      <button class="btn btn-secondary" @click="goBack">Back to Results</button>
    </div>
  </div>
</template>

<style scoped>
.team-detail {
  padding: 1rem;
}

.loading,
.error,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #d32f2f;
}

/* Header */
.team-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.back-link {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.team-header h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
}

.team-class {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Team info */
.team-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.info-label {
  color: #666;
}

.info-value {
  font-weight: 500;
}

/* Time section */
.time-section {
  margin-bottom: 1.5rem;
}

.time-section h2 {
  font-size: 1.1rem;
  margin: 0 0 0.75rem 0;
}

.time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.time-item {
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.time-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.time-value {
  font-weight: 500;
}

/* Score breakdown */
.score-section {
  margin-bottom: 1.5rem;
}

.score-section h2 {
  font-size: 1.1rem;
  margin: 0 0 0.75rem 0;
}

.score-breakdown {
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.score-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
}

.score-row:last-child {
  border-bottom: none;
}

.score-row.final {
  background: #e3f2fd;
  font-weight: 700;
}

.score-label {
  color: #666;
}

.score-row.final .score-label {
  color: #1976d2;
}

.score-value {
  font-weight: 500;
}

.score-value.bonus {
  color: #2e7d32;
}

.score-value.penalty {
  color: #d32f2f;
}

.score-row.final .score-value {
  color: #1976d2;
  font-size: 1.1rem;
}

/* Markings section */
.markings-section {
  margin-bottom: 1.5rem;
}

.markings-section h2 {
  font-size: 1.1rem;
  margin: 0 0 0.25rem 0;
}

.markings-note {
  font-size: 0.85rem;
  color: #888;
  margin: 0 0 0.75rem 0;
}

.markings-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.marking-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.marking-main {
  display: flex;
  flex-direction: column;
}

.marking-cp {
  font-weight: 600;
  font-family: monospace;
}

.marking-datetime {
  font-size: 0.8rem;
  color: #666;
}

.marking-score {
  font-weight: 600;
  color: #2e7d32;
}

.markings-empty {
  padding: 1.5rem;
  text-align: center;
  color: #888;
  background: #f5f5f5;
  border-radius: 4px;
}

.btn {
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  margin-top: 1rem;
}
</style>