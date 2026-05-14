import { api } from '@/api'
import type { MarkingResponse } from '@/types/race'

/**
 * Submit a marking (checkpoint scan) for the current user's team
 * POST /api/v1/Markings
 *
 * @param params - The marking submission parameters
 * @param params.checkPointId - CPID string like "OPEN-CP-1" or "OPEN-START", NOT a UUID
 * @param params.userTeamId - UUID of the user's team registration (from UserTeamListItem.id)
 * @param params.lat - Optional GPS latitude
 * @param params.lon - Optional GPS longitude
 * @param params.dt - Optional ISO date-time (server uses UtcNow if omitted)
 */
export async function submitMarking(params: {
  checkPointId: string
  userTeamId: string
  lat?: string | null
  lon?: string | null
  dt?: string
}): Promise<MarkingResponse> {
  const response = await api.post<MarkingResponse>(
    '/Markings',
    {
      checkPointId: params.checkPointId,
      userTeamId: params.userTeamId,
      lat: params.lat ?? null,
      lon: params.lon ?? null,
      dt: params.dt ?? null
    }
  )
  return response.data
}