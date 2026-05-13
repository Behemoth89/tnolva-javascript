<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContestStore } from '@/stores/contest'

const route = useRoute()
const router = useRouter()
const store = useContestStore()

const id = route.params.id as string

onMounted(async () => {
  // Fetch contests if not already loaded (needed for status flags)
  if (store.contests.length === 0) {
    await store.fetchContests()
  }
  await store.fetchContest(id)
})

// Contest classes sorted by orderNr
const contestClasses = computed(() => {
  if (!store.currentContest?.contestClasses) return []
  return [...store.currentContest.contestClasses].sort(
    (a, b) => a.orderNr - b.orderNr
  )
})

// Get isOpenForParticipation and hasResults from the contests list
// (these flags are on ContestListItem, not ContestDetails)
const contestStatus = computed(() => {
  const listItem = store.contests.find(c => c.id === id)
  return {
    isOpenForParticipation: listItem?.isOpenForParticipation ?? false,
    hasResults: listItem?.hasResults ?? false
  }
})

// Format duration in hours
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  return `${hours}h ${mins}m`
}

// Navigate to registration
function goToRegister() {
  router.push(`/contests/${id}/register`)
}

// Navigate to results
function goToResults() {
  router.push(`/contests/${id}/results`)
}
</script>

<template>
  <div class="contest-detail">
    <!-- Loading state -->
    <div v-if="store.loading" class="loading">
      <span>Loading contest details...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="store.error" class="error">
      <p>{{ store.error }}</p>
      <button @click="store.fetchContest(id)">Retry</button>
    </div>

    <!-- Contest content -->
    <template v-else-if="store.currentContest">
      <!-- Contest Header -->
      <header class="contest-header">
        <h1>{{ store.currentContest.name || 'Unnamed Contest' }}</h1>
        <div class="contest-dates">
          <span>{{ store.currentContest.openFrom }} → {{ store.currentContest.openTo }}</span>
        </div>
      </header>

      <!-- Classes Section -->
      <section class="classes-section">
        <h2>Classes</h2>
        <ul class="class-list">
          <li
            v-for="cls in contestClasses"
            :key="cls.id"
            class="class-item"
          >
            <div class="class-info">
              <span class="class-name">{{ cls.name || 'Unnamed Class' }}</span>
              <span class="class-duration">{{ formatDuration(cls.duration) }}</span>
            </div>
            <div v-if="cls.maxDuration" class="class-max-duration">
              Max: {{ formatDuration(cls.maxDuration) }}
            </div>
          </li>
        </ul>
      </section>

      <!-- Action Links -->
      <section class="action-section">
        <div v-if="contestStatus.isOpenForParticipation" class="action-buttons">
          <button class="btn btn-primary" @click="goToRegister">
            Register
          </button>
        </div>
        <div v-if="contestStatus.hasResults" class="action-buttons">
          <button class="btn btn-secondary" @click="goToResults">
            View Results
          </button>
        </div>
        <div
          v-if="!contestStatus.isOpenForParticipation && !contestStatus.hasResults"
          class="no-actions"
        >
          <p>Registration is closed and results are not yet available.</p>
        </div>
      </section>
    </template>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>Contest not found.</p>
    </div>
  </div>
</template>

<style scoped>
.contest-detail {
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

.contest-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.contest-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.contest-dates {
  color: #666;
  font-size: 0.9rem;
}

.classes-section {
  margin-bottom: 1.5rem;
}

.classes-section h2 {
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
}

.class-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.class-item {
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.class-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-name {
  font-weight: 500;
}

.class-duration {
  color: #666;
  font-size: 0.9rem;
}

.class-max-duration {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #888;
}

.action-section {
  margin-top: 1.5rem;
}

.action-buttons {
  margin-bottom: 0.75rem;
}

.btn {
  width: 100%;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.no-actions {
  text-align: center;
  color: #888;
  padding: 1rem;
}
</style>