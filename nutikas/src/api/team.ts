import { api } from '@/api'
import type { TeamRegistrationRequest, UserTeamListItem, UserTeamActivation } from '@/types/team'

/**
 * Register a new team for a contest
 * POST /Contests/{contestId}/teams
 */
export async function registerTeam(
  contestId: string,
  request: TeamRegistrationRequest
): Promise<UserTeamListItem> {
  const response = await api.post<UserTeamListItem>(
    `/Contests/${contestId}/teams`,
    request
  )
  return response.data
}

/**
 * Get all teams for the current user in a contest
 * GET /Contests/{contestId}/userteams
 */
export async function getUserTeams(contestId: string): Promise<UserTeamListItem[]> {
  const response = await api.get<UserTeamListItem[]>(
    `/Contests/${contestId}/userteams`
  )
  return response.data
}

/**
 * Get activation details for a specific team
 * GET /UserTeams/{teamId}
 */
export async function getUserTeamActivation(teamId: string): Promise<UserTeamActivation> {
  const response = await api.get<UserTeamActivation>(`/UserTeams/${teamId}`)
  return response.data
}