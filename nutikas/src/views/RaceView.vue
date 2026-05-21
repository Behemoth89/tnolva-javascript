<script setup lang="ts">
/**
 * RaceView — combined race participation screen
 * Per D-03/D-04: scanner and live score shown simultaneously.
 * State machine: pre-race → active → post-race
 */

import { onMounted, computed, ref, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useRaceStore } from '@/stores/race'
import { useTeamStore } from '@/stores/team'
import { provideToast } from '@/composables/useToast'
import TeamInfoCard from '@/components/TeamInfoCard.vue'
import ScoreCard from '@/components/ScoreCard.vue'
import RaceScanner from '@/components/RaceScanner.vue'
import RaceScorePanel from '@/components/RaceScorePanel.vue'
import type { TeamResultListItem } from '@/types/contest'
import { getContestResults } from '@/api/contest'

// Provide toast at this level (RaceView is a top-level view)
provideToast()

const route = useRoute()
const raceStore = useRaceStore()
const teamStore = useTeamStore()

// Route params
const contestId = computed(() => route.params.contestId as string)
const userTeamId = computed(() => route.params.userTeamId as string)

// Loading states
const loading = ref(true)
const error = ref<string | null>(null)
const positionLoading = ref(false)

// Position state
const position = ref<{ ordinal: number; total: number } | null>(null)

// Team info (from store)
const teamName = ref('')
const contestClassName = ref('')
const memberNames = ref<string | null>(null)
const contestClassId = ref('')

// Location state
const locationPermissionGranted = ref(false)

// Provide location permission for child components
provide('locationPermissionGranted', locationPermissionGranted)

// Derived race phase
const racePhase = computed((): 'pre' | 'active' | 'post' => {
  const state = raceStore.raceState
  if (state.finishDT !== null) return 'post'
  if (state.startDT !== null) return 'active'
  return 'pre'
})

// Load initial data
onMounted(async () => {
  try {
    // Request location permission early so it's ready when racing starts
    requestLocationPermission()

    // Load active team from IndexedDB
    await teamStore.loadActiveTeam()

    // If we have an active team, use it to get team info
    if (teamStore.activeTeam) {
      teamName.value = teamStore.activeTeam.teamName || ''
      contestClassId.value = teamStore.activeTeam.contestClassId || ''
    }

    // Load race state from activation if available
    if (userTeamId.value) {
      try {
        await teamStore.fetchTeamDetail(userTeamId.value)
        if (teamStore.currentTeamDetail) {
          raceStore.loadRaceState(teamStore.currentTeamDetail)

          // Extract team info from activation
          if (teamStore.currentTeamDetail.teamName) {
            teamName.value = teamStore.currentTeamDetail.teamName
          }
          // contestClassName is fetched from results API above
        }
      } catch {
        // Team detail might not exist yet - that's okay
      }
    }

    // Get class name from contest results
    if (contestClassId.value) {
      try {
        const results = await getContestResults(contestId.value)
        const classTeams = results.teams ?? []
        const classInfo = classTeams.find((r: TeamResultListItem) => r.contestClassId === contestClassId.value)
        if (classInfo) {
          contestClassName.value = classInfo.contestClassName || ''
        }
      } catch {
        // Results might not be available yet
      }
    }

    // Load position if race is active or post
    if (racePhase.value !== 'pre') {
      await refreshPosition()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load race data'
  } finally {
    loading.value = false
  }
})

/**
 * Refresh position from contest results
 */
async function refreshPosition(): Promise<void> {
  positionLoading.value = true
  try {
    const results = await getContestResults(contestId.value)
    const classTeams = (results.teams ?? []).filter((r: TeamResultListItem) => r.contestClassId === contestClassId.value)
    const sorted = [...classTeams].sort((a: TeamResultListItem, b: TeamResultListItem) =>
      b.finalScore - a.finalScore ||
      (a.finishDT && b.finishDT
        ? new Date(a.finishDT).getTime() - new Date(b.finishDT).getTime()
        : 0)
    )
    const index = sorted.findIndex((t: TeamResultListItem) => t.id === userTeamId.value)
    if (index >= 0) {
      position.value = { ordinal: index + 1, total: sorted.length }
    }
  } catch {
    // Position might not be available
  } finally {
    positionLoading.value = false
  }
}

/**
 * Handle manual refresh of score
 */
async function handleScoreRefresh(): Promise<void> {
  if (!userTeamId.value) return

  positionLoading.value = true
  try {
    await teamStore.fetchTeamDetail(userTeamId.value)
    if (teamStore.currentTeamDetail) {
      raceStore.loadRaceState(teamStore.currentTeamDetail)
    }
    await refreshPosition()
  } catch {
    // Refresh might fail - just keep current state
  } finally {
    positionLoading.value = false
  }
}

/**
 * Handle scan success events
 */
function handleScanSuccess(_checkPointId: string, _displayCPId: string): void {
  // Score is updated in the race store via submitScan
  // Refresh position to show updated ranking
  if (racePhase.value !== 'pre') {
    refreshPosition()
  }
}

function requestLocationPermission(): void {
  if (!navigator.geolocation) {
    locationPermissionGranted.value = false
    return
  }
  navigator.geolocation.getCurrentPosition(
    () => {
      locationPermissionGranted.value = true
    },
    () => {
      locationPermissionGranted.value = false
    },
    { timeout: 5000 }
  )
}

function retryLoad(): void {
  window.location.reload()
}

// Expose for child components
defineExpose({
  locationPermissionGranted
})
</script>

<template>
  <div class="race-view">
    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <span>Loading race...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="retryLoad">Retry</button>
    </div>

    <!-- Race content -->
    <template v-else>
      <!-- Pre-race: Team info + scanner preview -->
      <div v-if="racePhase === 'pre'" class="pre-race">
        <div class="left-panel">
          <TeamInfoCard
            :teamName="teamName"
            :contestClassName="contestClassName"
            :memberNames="memberNames"
          />
        </div>
        <div class="right-panel">
          <RaceScanner
            :contestId="contestId"
            :userTeamId="userTeamId"
            @scan-success="handleScanSuccess"
          />
        </div>
      </div>

      <!-- Active race: Scanner + live score -->
      <div v-else-if="racePhase === 'active'" class="active-race">
        <div class="score-panel">
          <ScoreCard
            :score="raceStore.raceState.score"
            :bonus="raceStore.raceState.bonus"
            :penalty="raceStore.raceState.penalty"
            :finalScore="raceStore.raceState.finalScore"
            :position="position"
            :contestId="contestId"
            :userTeamId="userTeamId"
            :contestClassId="contestClassId"
            :isLoading="positionLoading"
            :currentLat="raceStore.raceState.currentLat"
            :currentLon="raceStore.raceState.currentLon"
            @refresh="handleScoreRefresh"
          />
        </div>
        <div class="scanner-panel">
          <RaceScanner
            :contestId="contestId"
            :userTeamId="userTeamId"
            @scan-success="handleScanSuccess"
          />
        </div>
      </div>

      <!-- Post-race: Final score breakdown + scanner -->
      <div v-else-if="racePhase === 'post'" class="post-race">
        <div class="score-panel">
          <RaceScorePanel
            :startDT="raceStore.raceState.startDT"
            :finishDT="raceStore.raceState.finishDT"
            :score="raceStore.raceState.score"
            :bonus="raceStore.raceState.bonus"
            :penalty="raceStore.raceState.penalty"
            :finalScore="raceStore.raceState.finalScore"
          />
        </div>
        <div class="scanner-panel">
          <!-- Scanner still visible post-race for verification -->
          <RaceScanner
            :contestId="contestId"
            :userTeamId="userTeamId"
            @scan-success="handleScanSuccess"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.race-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 1rem;
}

.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #666;
}

.error {
  color: #d32f2f;
}

.error button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Pre-race layout */
.pre-race,
.active-race,
.post-race {
  display: grid;
  gap: 1rem;
}

/* Mobile-first: stack vertically on small screens */
@media (max-width: 768px) {
  .pre-race,
  .active-race,
  .post-race {
    grid-template-columns: 1fr;
  }

  .right-panel,
  .scanner-panel {
    order: 1; /* Scanner on top for mobile */
  }

  .left-panel,
  .score-panel {
    order: 2;
  }
}

/* Desktop: side-by-side layout */
@media (min-width: 769px) {
  .pre-race,
  .active-race,
  .post-race {
    grid-template-columns: 350px 1fr;
  }

  .left-panel,
  .score-panel {
    position: sticky;
    top: 1rem;
    align-self: start;
  }
}

.left-panel,
.score-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.right-panel,
.scanner-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>