/**
 * Team registration and management type definitions
 * Matches the API spec DTOs exactly
 */

// Team registration request (api-spec.json lines 2861-2885)
export interface TeamRegistrationRequest {
  teamName: string        // max 128, min 1
  teamMembers: string     // max 255, min 1 — comma-separated member names
  contestClassId: string  // UUID
}

// User team list item (api-spec.json lines 3064-3107)
export interface UserTeamListItem {
  id: string              // UUID
  teamId: string          // UUID
  teamName: string | null
  memberNames: string | null
  contestClassId: string   // UUID
  contestClassName: string | null
  startDT: string | null  // ISO date-time
  finishDT: string | null // ISO date-time
  finalScore: number | null
}

// User team activation (api-spec.json lines 3005-3063)
export interface UserTeamActivation {
  userTeamId: string
  teamName: string | null
  contestId: string      // UUID
  contestName: string | null
  contestClassName: string | null
  startDT: string | null
  finishDT: string | null
  score: number
  bonus: number
  penalty: number
  finalScore: number
  markings: import('./contest').MarkingListItem[] | null
}

// Active team record stored in IndexedDB
export interface ActiveTeamRecord {
  id: string      // constant 'current'
  teamId: string
  contestId: string
  teamName: string
  contestClassId: string
}