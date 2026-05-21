import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  OrganisationItem,
  OrganiserContestDetails
} from '@/types/api'
import { organiserApi } from '@/api/endpoints/organiser'

export const useOrganiserStore = defineStore('organiser', () => {
  const organisations = ref<OrganisationItem[]>([])
  const currentOrgId = ref<string | null>(null)
  const contests = ref<OrganiserContestDetails[]>([])
  const currentContestId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const currentOrg = computed(() =>
    organisations.value.find(o => o.id === currentOrgId.value) ?? null
  )

  const currentContest = computed(() =>
    contests.value.find(c => c.id === currentContestId.value) ?? null
  )

  async function loadOrganisations() {
    isLoading.value = true
    error.value = null
    try {
      organisations.value = await organiserApi.getOrganisations()
      // Auto-select first org if none selected
      if (!currentOrgId.value && organisations.value.length > 0) {
        currentOrgId.value = organisations.value[0].id
      }
    } catch (e: any) {
      error.value = e.message ?? 'Failed to load organisations'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function loadContests(orgId?: string) {
    isLoading.value = true
    error.value = null
    try {
      contests.value = await organiserApi.getContests()
      // Filter by org if specified (API returns all for now)
      if (orgId) {
        contests.value = contests.value.filter(c => c.organisationId === orgId)
      }
    } catch (e: any) {
      error.value = e.message ?? 'Failed to load contests'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  function setCurrentOrg(orgId: string) {
    currentOrgId.value = orgId
    // Reload contests for the new org
    loadContests(orgId)
  }

  function setCurrentContest(contestId: string | null) {
    currentContestId.value = contestId
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    organisations,
    currentOrgId,
    contests,
    currentContestId,
    isLoading,
    error,
    // Computed
    currentOrg,
    currentContest,
    // Actions
    loadOrganisations,
    loadContests,
    setCurrentOrg,
    setCurrentContest,
    clearError
  }
})