import { api } from '@/api'
import type {
  ContestListItem,
  ContestDetails,
  ContestResults,
  TeamResultDetail
} from '@/types/contest'

/**
 * Contest API client functions
 * All endpoints are public — no authentication required
 */

/**
 * GET /Contests — list all contests
 */
export async function getContests(): Promise<ContestListItem[]> {
  const response = await api.get<ContestListItem[]>('/Contests')
  return response.data
}

/**
 * GET /Contests/{id} — get contest details
 */
export async function getContest(id: string): Promise<ContestDetails> {
  const response = await api.get<ContestDetails>(`/Contests/${id}`)
  return response.data
}

/**
 * GET /Contests/{id}/results — get contest results
 */
export async function getContestResults(id: string): Promise<ContestResults> {
  const response = await api.get<ContestResults>(`/Contests/${id}/results`)
  return response.data
}

/**
 * GET /Contests/{contestId}/teams/{teamId} — get team result detail
 */
export async function getTeamDetail(
  contestId: string,
  teamId: string
): Promise<TeamResultDetail> {
  const response = await api.get<TeamResultDetail>(
    `/Contests/${contestId}/teams/${teamId}`
  )
  return response.data
}