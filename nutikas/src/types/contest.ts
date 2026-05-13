/**
 * Contest type definitions
 * Matches the API spec DTOs exactly
 */

// Contest list item (api-spec.json line 1991)
export interface ContestListItem {
  id: string // uuid
  name: string | null
  visibleFrom: string // datetime
  openFrom: string // datetime
  openTo: string // datetime
  isOpenForParticipation: boolean
  hasResults: boolean
}

// Contest class list item (api-spec.json line 1935)
export interface ContestClassListItem {
  id: string // uuid
  name: string | null
  orderNr: number
  duration: number
  maxDuration: number | null
}

// Contest details (api-spec.json line 1962)
export interface ContestDetails {
  id: string // uuid
  name: string | null
  openFrom: string // datetime
  openTo: string // datetime
  contestClasses: ContestClassListItem[] | null
}

// Contest results (api-spec.json line 2023)
export interface ContestResults {
  contest: ContestListItem
  teams: TeamResultListItem[] | null
}

// Team result list item (api-spec.json line 2949)
export interface TeamResultListItem {
  id: string // uuid
  name: string | null
  memberNames: string | null
  contestClassId: string // uuid
  contestClassName: string | null
  contestClassOrderNr: number
  startDT: string | null // datetime
  finishDT: string | null // datetime
  score: number
  bonus: number
  penalty: number
  finalScore: number
}

// Marking list item (api-spec.json line 2124)
export interface MarkingListItem {
  id: string // uuid
  dt: string // datetime
  checkPointId: string // uuid
  checkPointCPID: string | null
  checkPointCPCode: string | null
  checkPointType: string // Domain.ECheckPointType
  score: number
  lat: string | null
  lon: string | null
}

// Team result detail extends TeamResultListItem with markings (api-spec.json line 2886)
export type TeamResultDetail = TeamResultListItem & {
  markings: MarkingListItem[] | null
}