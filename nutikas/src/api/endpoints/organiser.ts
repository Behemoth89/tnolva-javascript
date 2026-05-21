import { api } from '@/api'
import type {
  OrganisationItem,
  OrganiserContestDetails,
  OrganiserContestUpsertRequest,
  OrganiserContestClassDetails,
  OrganiserContestClassUpsertRequest,
  OrganiserCheckPointDetails,
  OrganiserCheckPointUpsertRequest,
  OrganiserTeamDetails,
  OrganiserTeamUpsertRequest,
  OrganiserUserTeamItem,
  OrganiserMarkingListItem,
  OrganiserMarkingCreateRequest,
  OrganiserMarkingUpdateRequest,
  OrganiserMarkingDetails,
  PagedResponse,
  MarkingResponse
} from '@/types/api'

export const organiserApi = {
  // Organisations
  async getOrganisations(): Promise<OrganisationItem[]> {
    const res = await api.get('/organiser/Organisations')
    return res.data
  },

  // Contests
  async getContests(): Promise<OrganiserContestDetails[]> {
    const res = await api.get('/organiser/Contests')
    return res.data
  },
  async getContest(id: string): Promise<OrganiserContestDetails> {
    const res = await api.get(`/organiser/Contests/${id}`)
    return res.data
  },
  async createContest(data: OrganiserContestUpsertRequest): Promise<OrganiserContestDetails> {
    const res = await api.post('/organiser/Contests', data)
    return res.data
  },
  async updateContest(id: string, data: OrganiserContestUpsertRequest): Promise<OrganiserContestDetails> {
    const res = await api.put(`/organiser/Contests/${id}`, data)
    return res.data
  },
  async deleteContest(id: string): Promise<void> {
    await api.delete(`/organiser/Contests/${id}`)
  },

  // Classes
  async getClasses(contestId: string): Promise<OrganiserContestClassDetails[]> {
    const res = await api.get(`/organiser/contests/${contestId}/contest-classes`)
    return res.data
  },
  async createClass(contestId: string, data: OrganiserContestClassUpsertRequest): Promise<OrganiserContestClassDetails> {
    const res = await api.post(`/organiser/contests/${contestId}/contest-classes`, data)
    return res.data
  },
  async updateClass(id: string, data: OrganiserContestClassUpsertRequest): Promise<OrganiserContestClassDetails> {
    const res = await api.put(`/organiser/contest-classes/${id}`, data)
    return res.data
  },
  async deleteClass(id: string): Promise<void> {
    await api.delete(`/organiser/contest-classes/${id}`)
  },

  // Checkpoints
  async getCheckpoints(contestId: string): Promise<OrganiserCheckPointDetails[]> {
    const res = await api.get(`/organiser/contests/${contestId}/check-points`)
    return res.data
  },
  async createCheckpoint(contestId: string, data: OrganiserCheckPointUpsertRequest): Promise<OrganiserCheckPointDetails> {
    const res = await api.post(`/organiser/contests/${contestId}/check-points`, data)
    return res.data
  },
  async updateCheckpoint(id: string, data: OrganiserCheckPointUpsertRequest): Promise<OrganiserCheckPointDetails> {
    const res = await api.put(`/organiser/check-points/${id}`, data)
    return res.data
  },
  async deleteCheckpoint(id: string): Promise<void> {
    await api.delete(`/organiser/check-points/${id}`)
  },

  // Teams
  async getTeams(contestId: string): Promise<OrganiserTeamDetails[]> {
    const res = await api.get(`/organiser/contests/${contestId}/teams`)
    return res.data
  },
  async getTeam(id: string): Promise<OrganiserTeamDetails> {
    const res = await api.get(`/organiser/Teams/${id}`)
    return res.data
  },
  async createTeam(contestId: string, data: OrganiserTeamUpsertRequest): Promise<OrganiserTeamDetails> {
    const res = await api.post(`/organiser/contests/${contestId}/teams`, data)
    return res.data
  },
  async updateTeam(id: string, data: OrganiserTeamUpsertRequest): Promise<OrganiserTeamDetails> {
    const res = await api.put(`/organiser/Teams/${id}`, data)
    return res.data
  },
  async deleteTeam(id: string): Promise<void> {
    await api.delete(`/organiser/Teams/${id}`)
  },

  // Team members (UserTeams)
  async getTeamMembers(teamId: string): Promise<OrganiserUserTeamItem[]> {
    const res = await api.get(`/organiser/teams/${teamId}/user-teams`)
    return res.data
  },
  async addTeamMember(teamId: string, email: string): Promise<OrganiserUserTeamItem> {
    const res = await api.post(`/organiser/teams/${teamId}/user-teams`, { email })
    return res.data
  },
  async removeTeamMember(userTeamId: string): Promise<void> {
    await api.delete(`/organiser/user-teams/${userTeamId}`)
  },

  // Markings
  async getMarkings(contestId: string, page = 1, pageSize = 25, teamId?: string): Promise<PagedResponse<OrganiserMarkingListItem>> {
    const params: any = { page, pageSize }
    if (teamId) params.teamId = teamId
    const res = await api.get(`/organiser/contests/${contestId}/markings`, { params })
    return res.data
  },
  async getMarking(id: string): Promise<OrganiserMarkingDetails> {
    const res = await api.get(`/organiser/Markings/${id}`)
    return res.data
  },
  async createMarking(teamId: string, data: OrganiserMarkingCreateRequest): Promise<MarkingResponse> {
    const res = await api.post(`/organiser/teams/${teamId}/markings`, data)
    return res.data
  },
  async updateMarking(id: string, data: OrganiserMarkingUpdateRequest): Promise<OrganiserMarkingDetails> {
    const res = await api.put(`/organiser/Markings/${id}`, data)
    return res.data
  },
  async deleteMarking(id: string): Promise<void> {
    await api.delete(`/organiser/Markings/${id}`)
  }
}