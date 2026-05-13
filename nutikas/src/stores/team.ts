import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as teamApi from '@/api/team'
import type { UserTeamListItem, UserTeamActivation, ActiveTeamRecord } from '@/types/team'
import { db } from '@/db'

export const useTeamStore = defineStore('team', () => {
  // State
  const myTeams = ref<UserTeamListItem[]>([])
  const activeTeam = ref<ActiveTeamRecord | null>(null)
  const currentTeamDetail = ref<UserTeamActivation | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions

  /**
   * Load the active team from IndexedDB
   */
  async function loadActiveTeam(): Promise<void> {
    const record = await db.activeTeam.get('current')
    activeTeam.value = record ?? null
  }

  /**
   * Set a team as the active team (persisted to IndexedDB)
   */
  async function setActiveTeam(team: UserTeamListItem): Promise<void> {
    const record: ActiveTeamRecord = {
      id: 'current',
      teamId: team.teamId,
      contestId: team.contestClassId, // Note: UserTeamListItem has contestClassId, not contestId
      teamName: team.teamName ?? '',
      contestClassId: team.contestClassId
    }
    await db.activeTeam.put(record)
    activeTeam.value = record
  }

  /**
   * Clear the active team from IndexedDB
   */
  async function clearActiveTeam(): Promise<void> {
    await db.activeTeam.delete('current')
    activeTeam.value = null
  }

  /**
   * Fetch all teams for the current user in a contest
   */
  async function fetchMyTeams(contestId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      myTeams.value = await teamApi.getUserTeams(contestId)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch teams'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch activation details for a specific team
   */
  async function fetchTeamDetail(teamId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      currentTeamDetail.value = await teamApi.getUserTeamActivation(teamId)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch team detail'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    myTeams,
    activeTeam,
    currentTeamDetail,
    loading,
    error,
    // Actions
    loadActiveTeam,
    setActiveTeam,
    clearActiveTeam,
    fetchMyTeams,
    fetchTeamDetail
  }
})