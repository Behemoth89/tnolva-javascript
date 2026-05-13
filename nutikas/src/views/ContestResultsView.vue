<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContestStore } from '@/stores/contest'

const route = useRoute()
const router = useRouter()
const store = useContestStore()

const id = route.params.id as string

// Tab state: 'all' or a contestClassOrderNr value
const selectedClassOrderNr = ref<string | null>('all')

onMounted(async () => {
  await store.fetchContestResults(id)
})

// Contest name from results
const contestName = computed(() => {
  return store.currentResults?.contest?.name || 'Contest Results'
})

// Unique class tabs derived from teams
const classTabs = computed(() => {
  const teams = store.currentResults?.teams
  if (!teams || teams.length === 0) return []

  // Group by contestClassOrderNr, preserve orderNr for sorting
  const classMap = new Map<number, { orderNr: number; name: string | null }>()
  for (const team of teams) {
    if (!classMap.has(team.contestClassOrderNr)) {
      classMap.set(team.contestClassOrderNr, {
        orderNr: team.contestClassOrderNr,
        name: team.contestClassName
      })
    }
  }

  // Return sorted by orderNr
  return [...classMap.values()].sort((a, b) => a.orderNr - b.orderNr)
})

// Filter teams by selected tab
const filteredTeams = computed(() => {
  const teams = store.currentResults?.teams
  if (!teams || teams.length === 0) return []

  if (selectedClassOrderNr.value === 'all') {
    return teams
  }

  const orderNr = Number(selectedClassOrderNr.value)
  return teams.filter(team => team.contestClassOrderNr === orderNr)
})

// Sort filtered teams by finalScore descending, assign rank
const sortedTeams = computed(() => {
  const sorted = [...filteredTeams.value].sort((a, b) => b.finalScore - a.finalScore)
  return sorted.map((team, index) => ({
    ...team,
    rank: index + 1
  }))
})

// Select a tab
function selectTab(orderNr: string | null) {
  selectedClassOrderNr.value = orderNr
}

// Navigate to team detail
function goToTeamDetail(teamId: string) {
  router.push(`/contests/${id}/teams/${teamId}`)
}

// Navigate back to contest detail
function goBack() {
  router.push(`/contests/${id}`)
}

// Check if results are available
const hasResults = computed(() => {
  return store.currentResults?.teams !== null
})
</script>

<template>
  <div class="contest-results">
    <!-- Loading state -->
    <div v-if="store.loading" class="loading">
      <span>Loading results...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="store.error" class="error">
      <p>{{ store.error }}</p>
      <button @click="store.fetchContestResults(id)">Retry</button>
    </div>

    <!-- Empty state: no results yet -->
    <div v-else-if="!hasResults" class="empty-state">
      <p class="empty-message">Results not yet available — contest may still be in progress.</p>
      <button class="btn btn-secondary" @click="goBack">Back to Contest</button>
    </div>

    <!-- Results content -->
    <template v-else>
      <!-- Header -->
      <header class="results-header">
        <button class="back-link" @click="goBack">← Back to Contest</button>
        <h1>{{ contestName }}</h1>
      </header>

      <!-- Tab bar -->
      <nav class="tab-bar">
        <button
          class="tab"
          :class="{ active: selectedClassOrderNr === 'all' }"
          @click="selectTab('all')"
        >
          All
        </button>
        <button
          v-for="cls in classTabs"
          :key="cls.orderNr"
          class="tab"
          :class="{ active: selectedClassOrderNr === String(cls.orderNr) }"
          @click="selectTab(String(cls.orderNr))"
        >
          {{ cls.name || 'Class ' + cls.orderNr }}
        </button>
      </nav>

      <!-- Results table -->
      <div class="results-table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th class="col-rank">Rank</th>
              <th class="col-team">Team</th>
              <th class="col-members">Members</th>
              <th class="col-score">Score</th>
              <th class="col-bonus">Bonus</th>
              <th class="col-penalty">Penalty</th>
              <th class="col-final">Final</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="team in sortedTeams"
              :key="team.id"
              class="team-row"
              @click="goToTeamDetail(team.id)"
            >
              <td class="col-rank">{{ team.rank }}</td>
              <td class="col-team">{{ team.name || 'Unnamed Team' }}</td>
              <td class="col-members">{{ team.memberNames || '-' }}</td>
              <td class="col-score">{{ team.score }}</td>
              <td class="col-bonus">+{{ team.bonus }}</td>
              <td class="col-penalty">-{{ team.penalty }}</td>
              <td class="col-final">{{ team.finalScore }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Empty filtered state -->
        <div v-if="sortedTeams.length === 0" class="table-empty">
          <p>No teams in this class yet.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.contest-results {
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

.empty-state .empty-message {
  margin-bottom: 1rem;
  color: #888;
}

.results-header {
  margin-bottom: 1rem;
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

.results-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

/* Tab bar */
.tab-bar {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.tab {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px 4px 0 0;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.tab:hover {
  background: #e8e8e8;
}

.tab.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

/* Results table */
.results-table-wrapper {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

.results-table th,
.results-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.results-table th {
  font-weight: 600;
  color: #666;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.col-rank {
  width: 3rem;
  text-align: center;
}

.col-team {
  font-weight: 500;
}

.col-members {
  color: #666;
  font-size: 0.9rem;
}

.col-score,
.col-bonus,
.col-penalty,
.col-final {
  text-align: right;
}

.col-bonus {
  color: #2e7d32;
}

.col-penalty {
  color: #d32f2f;
}

.col-final {
  font-weight: 700;
  color: #1976d2;
}

.team-row {
  cursor: pointer;
  transition: background 0.15s;
}

.team-row:hover {
  background: #f5f5f5;
}

.table-empty {
  text-align: center;
  padding: 2rem;
  color: #888;
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
}
</style>