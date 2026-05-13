import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as contestApi from '@/api/contest'
import type {
  ContestListItem,
  ContestDetails,
  ContestResults,
  TeamResultDetail
} from '@/types/contest'

export const useContestStore = defineStore('contest', () => {
  // State
  const contests = ref<ContestListItem[]>([])
  const currentContest = ref<ContestDetails | null>(null)
  const currentResults = ref<ContestResults | null>(null)
  const currentTeamDetail = ref<TeamResultDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchContests(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      contests.value = await contestApi.getContests()
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch contests'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchContest(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      currentContest.value = await contestApi.getContest(id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch contest details'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchContestResults(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      currentResults.value = await contestApi.getContestResults(id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch contest results'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTeamDetail(
    contestId: string,
    teamId: string
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      currentTeamDetail.value = await contestApi.getTeamDetail(contestId, teamId)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch team detail'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearResults(): void {
    currentResults.value = null
  }

  return {
    // State
    contests,
    currentContest,
    currentResults,
    currentTeamDetail,
    loading,
    error,
    // Actions
    fetchContests,
    fetchContest,
    fetchContestResults,
    fetchTeamDetail,
    clearResults
  }
})