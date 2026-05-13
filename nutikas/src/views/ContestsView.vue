<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContestStore } from '@/stores/contest'
import type { ContestListItem } from '@/types/contest'

const router = useRouter()
const store = useContestStore()

onMounted(() => {
  store.fetchContests()
})

// Filter to only visible contests (visibleFrom <= now, null means always visible)
const visibleContests = computed(() => {
  const now = new Date()
  return store.contests.filter((contest) => {
    if (!contest.visibleFrom) return true // null means always visible
    return new Date(contest.visibleFrom) <= now
  })
})

// Determine status badge content and style
function getStatusBadge(item: ContestListItem): { text: string; class: string } {
  if (item.isOpenForParticipation) {
    return { text: 'Open for Registration', class: 'bg-green-100 text-green-800' }
  }
  if (item.hasResults) {
    return { text: 'Results Available', class: 'bg-blue-100 text-blue-800' }
  }
  return { text: 'Coming Soon', class: 'bg-gray-100 text-gray-800' }
}

// Format date for display
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
</style>