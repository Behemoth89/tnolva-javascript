<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamStore } from '@/stores/team'
import type { UserTeamListItem } from '@/types/team'

const route = useRoute()
const router = useRouter()
const teamStore = useTeamStore()

const contestId = route.params.id as string

const expandedId = ref<string | null>(null)

onMounted(async () => {
  await teamStore.loadActiveTeam()
  await teamStore.fetchMyTeams(contestId)
})

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function isActive(team: UserTeamListItem): boolean {
  return teamStore.activeTeam?.teamId === team.teamId
}

async function setActive(team: UserTeamListItem) {
  await teamStore.setActiveTeam(team)
}

function goBack() {
  router.push(`/contests/${contestId}`)
}

function goToContest() {
  router.push(`/contests/${contestId}`)
}

function startRace(team: UserTeamListItem) {
  router.push(`/race/${contestId}/${team.id}`)
}

function formatDateTime(dt: string | null): string {
  if (!dt) return 'N/A'
  const date = new Date(dt)
  return date.toLocaleString()
}
</script>

<template>
  <div class="my-teams">
    <!-- Header -->
    <header class="page-header">
      <button class="back-btn" @click="goBack" aria-label="Back to contest">
        ← Back
      </button>
      <h1>My Teams</h1>
    </header>

    <!-- Loading state -->
    <div v-if="teamStore.loading" class="loading">
      <span>Loading teams...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="teamStore.error" class="error">
      <p>{{ teamStore.error }}</p>
      <button @click="teamStore.fetchMyTeams(contestId)" class="retry-btn">
        Retry
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="teamStore.myTeams.length === 0"
      class="empty-state"
    >
      <p>No teams yet.</p>
      <button @click="goToContest" class="link-btn">
        Go to contest to register
      </button>
    </div>

    <!-- Team list -->
    <div v-else class="team-list">
      <div
        v-for="team in teamStore.myTeams"
        :key="team.id"
        class="team-item"
        :class="{ active: isActive(team) }"
      >
        <div class="team-header" @click="toggleExpand(team.id)">
          <div class="team-info">
            <span class="team-name">{{ team.teamName || 'Unnamed Team' }}</span>
            <span class="team-class">{{ team.contestClassName || 'Unknown Class' }}</span>
            <span v-if="team.finalScore !== null" class="team-score">
              Score: {{ team.finalScore }}
            </span>
            <span v-if="isActive(team)" class="active-badge">Active</span>
          </div>
          <span class="expand-icon">{{ expandedId === team.id ? '▼' : '▶' }}</span>
        </div>

        <!-- Expandable detail -->
        <div v-if="expandedId === team.id" class="team-detail">
          <div class="detail-row">
            <span class="detail-label">Members:</span>
            <span class="detail-value">{{ team.memberNames || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Start:</span>
            <span class="detail-value">{{ formatDateTime(team.startDT) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Finish:</span>
            <span class="detail-value">{{ formatDateTime(team.finishDT) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Final Score:</span>
            <span class="detail-value">{{ team.finalScore ?? 'N/A' }}</span>
          </div>
          <div v-if="!isActive(team)" class="detail-actions">
            <button @click.stop="setActive(team)" class="btn btn-primary">
              Set as Active
            </button>
          </div>
          <div v-else class="detail-actions">
            <button @click.stop="startRace(team)" class="btn btn-race">
              Start Race
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-teams {
  padding: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.back-btn {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
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

.retry-btn,
.link-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.team-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.team-item.active {
  border-color: #1976d2;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  background: #fafafa;
}

.team-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.team-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.team-class {
  color: #666;
}

.team-score {
  color: #1976d2;
  font-weight: 500;
}

.active-badge {
  background: #1976d2;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

.expand-icon {
  color: #666;
  font-size: 0.875rem;
}

.team-detail {
  padding: 1rem;
  background: white;
  border-top: 1px solid #eee;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  color: #666;
}

.detail-value {
  font-weight: 500;
}

.detail-actions {
  margin-top: 1rem;
  padding-top: 0.5rem;
}

.btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #1976d2;
  color: white;
  width: 100%;
}

.btn-race {
  background: #2e7d32;
  color: white;
  width: 100%;
}
</style>