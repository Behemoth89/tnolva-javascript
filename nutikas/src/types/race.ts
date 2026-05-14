/**
 * Race participation type definitions
 * Matches the API spec DTOs exactly
 */

import type { UserTeamActivation } from '@/types/team'
import type { MarkingListItem } from '@/types/contest'

// Marking request body for POST /api/v1/Markings
export interface MarkingRequest {
  checkPointId: string       // CPID string like "OPEN-CP-1" or "OPEN-START", NOT a UUID
  userTeamId: string          // UUID of the user's team registration (from UserTeamListItem.id)
  lat?: string | null         // optional GPS latitude
  lon?: string | null         // optional GPS longitude
  dt?: string                 // optional ISO date-time (server uses UtcNow if omitted)
}

// Marking response from POST /api/v1/Markings
export interface MarkingResponse {
  statusOk: boolean
  statusCode: 0 | 1 | 2 | 3 | 4  // 0=Ok, 1=Error, 2=EventNotStarted, 3=EventFinished, 4=EventAlreadyStarted
  message: string | null
  result: UserTeamActivation | null
}

// Reactive race state tracked in the store
export interface RaceState {
  startDT: string | null
  finishDT: string | null
  score: number
  bonus: number
  penalty: number
  finalScore: number
  scannedCPIds: string[]  // track scanned CP IDs for "Already scanned" detection (array for JSON serialization)
}

// Normalized result from submitMarking handling
export interface MarkingSubmitResult {
  statusOk: boolean
  statusCode: number
  isAlreadyScanned: boolean  // true when statusOk=true and statusCode=0 but the CP was already in scannedCPIds
  activation: UserTeamActivation | null
  message: string | null
}