import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { submitMarking } from '@/api/marking'
import type { RaceState, MarkingSubmitResult } from '@/types/race'
import type { UserTeamActivation } from '@/types/team'

const initialRaceState = (): RaceState & { currentLat: string | null; currentLon: string | null } => ({
  startDT: null,
  finishDT: null,
  score: 0,
  bonus: 0,
  penalty: 0,
  finalScore: 0,
  scannedCPIds: [],
  currentLat: null,
  currentLon: null
})

export const useRaceStore = defineStore('race', () => {
  // State
  const raceState = ref<RaceState>(initialRaceState())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isStarted = computed(() => raceState.value.startDT !== null)
  const isFinished = computed(() => raceState.value.finishDT !== null)

  // Actions

  /**
   * Submit a checkpoint scan
   * @returns MarkingSubmitResult with isAlreadyScanned detection
   */
  async function submitScan(
    checkPointId: string,
    userTeamId: string,
    extras?: { lat?: string | null; lon?: string | null; dt?: string }
  ): Promise<MarkingSubmitResult> {
    loading.value = true
    error.value = null

    try {
      const response = await submitMarking({ checkPointId, userTeamId, ...extras })

      // Detect if this CP was already scanned
      const isAlreadyScanned = raceState.value.scannedCPIds.includes(checkPointId)

      // Build normalized result
      const result: MarkingSubmitResult = {
        statusOk: response.statusOk,
        statusCode: response.statusCode,
        isAlreadyScanned,
        activation: response.result,
        message: response.message
      }

      // Update race state from response if result is not null
      if (response.result) {
        raceState.value.startDT = response.result.startDT
        raceState.value.finishDT = response.result.finishDT
        raceState.value.score = response.result.score
        raceState.value.bonus = response.result.bonus
        raceState.value.penalty = response.result.penalty
        raceState.value.finalScore = response.result.finalScore
      }

      // Track scanned CP if not already scanned
      if (!isAlreadyScanned) {
        raceState.value.scannedCPIds.push(checkPointId)
      }

      // Update current location if provided
      if (extras?.lat) raceState.value.currentLat = extras.lat
      if (extras?.lon) raceState.value.currentLon = extras.lon

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit scan'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset race state to initial values
   */
  function resetRace(): void {
    raceState.value = initialRaceState()
    error.value = null
  }

  /**
   * Load race state from a previously fetched activation
   * @param activation - UserTeamActivation from API
   */
  function loadRaceState(activation: UserTeamActivation): void {
    raceState.value.startDT = activation.startDT
    raceState.value.finishDT = activation.finishDT
    raceState.value.score = activation.score
    raceState.value.bonus = activation.bonus
    raceState.value.penalty = activation.penalty
    raceState.value.finalScore = activation.finalScore

    // Pre-fill scannedCPIds from activation.markings if available
    if (activation.markings && activation.markings.length > 0) {
      raceState.value.scannedCPIds = activation.markings.map(m => m.checkPointCPID).filter((cpid): cpid is string => cpid !== null)
    } else {
      raceState.value.scannedCPIds = []
    }
  }

  function updateLocation(lat: string, lon: string): void {
    raceState.value.currentLat = lat
    raceState.value.currentLon = lon
  }

  return {
    // State
    raceState,
    loading,
    error,
    // Computed
    isStarted,
    isFinished,
    // Actions
    submitScan,
    resetRace,
    loadRaceState,
    updateLocation
  }
})