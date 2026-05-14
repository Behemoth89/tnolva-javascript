<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useContestStore } from '@/stores/contest'
import { useAuthStore } from '@/stores/auth'
import { useTeamStore } from '@/stores/team'
import type { ContestListItem } from '@/types/contest'

const router = useRouter()
const contestStore = useContestStore()
const auth = useAuthStore()
const teamStore = useTeamStore()
const myContestIds = ref<Set<string>>(new Set())
const myTeamsByContest = ref<Map<string, string>>(new Map())

onMounted(async () => {
  contestStore.fetchContests()
  if (auth.isAuthenticated) {
    await loadUserTeams()
  }
})

async function loadUserTeams(): Promise<void> {
  const contests = contestStore.contests
  for (const contest of contests) {
    try {
      await teamStore.fetchMyTeams(contest.id)
      if (teamStore.myTeams.length > 0) {
        myContestIds.value.add(contest.id)
        for (const team of teamStore.myTeams) {
          myTeamsByContest.value.set(contest.id, team.teamId)
        }
      }
    } catch {
    }
  }
}

const visibleContests = computed(() => {
  const now = new Date()
  return contestStore.contests.filter((contest) => {
    if (!contest.visibleFrom) return true
    return new Date(contest.visibleFrom) <= now
  })
})

function getStatusBadge(item: ContestListItem): { text: string; class: string } {
  if (item.isOpenForParticipation) {
    return { text: 'Open for Registration', class: 'bg-green-100 text-green-800' }
  }
  if (item.hasResults) {
    return { text: 'Results Available', class: 'bg-blue-100 text-blue-800' }
  }
  return { text: 'Coming Soon', class: 'bg-gray-100 text-gray-800' }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function navigateToDetail(id: string) {
  router.push({ name: 'contest-detail', params: { id } })
}

function navigateToMyTeams(event: Event, id: string) {
  event.stopPropagation()
  router.push({ name: 'my-teams', params: { id } })
}
</script>

<template>
  <div class="page-container">
    <h1 class="text-2xl font-bold mb-6">Contests</h1>

    <div v-if="store.loading" class="text-gray-500">Loading...</div>
    <div v-else-if="store.error" class="text-red-600">{{ store.error }}</div>
    <div v-else-if="visibleContests.length === 0" class="text-gray-500">
      No contests available
    </div>
    <div v-else class="contest-list">
      <div
        v-for="item in visibleContests"
        :key="item.id"
        class="contest-card"
        :class="{ 'has-team': myContestIds.has(item.id) }"
        @click="navigateToDetail(item.id)"
        role="button"
        tabindex="0"
        @keydown.enter="navigateToDetail(item.id)"
      >
        <div class="contest-card-header">
          <h2 class="contest-name">{{ item.name || 'Unnamed Contest' }}</h2>
          <span class="status-badge" :class="getStatusBadge(item).class">
            {{ getStatusBadge(item).text }}
          </span>
        </div>
        <div class="contest-dates">
          {{ formatDate(item.openFrom) }} → {{ formatDate(item.openTo) }}
        </div>
        <button
          v-if="myContestIds.has(item.id)"
          class="my-teams-btn"
          @click="navigateToMyTeams($event, item.id)"
        >
          My Teams
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.contest-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contest-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.contest-card.has-team {
  border: 2px solid #2563eb;
  background: #f0f7ff;
}

.contest-card:focus {
  outline: 2px solid blue;
  outline-offset: 2px;
}

.contest-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.contest-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.contest-dates {
  font-size: 0.875rem;
  color: #6b7280;
}

.my-teams-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  font-weight: 600;
}

.my-teams-btn:hover {
  background: #1d4ed8;
}
</style>