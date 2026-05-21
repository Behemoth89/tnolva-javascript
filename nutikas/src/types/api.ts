export interface JWTResponse {
  jwt: string
  refreshToken: string
}

export interface LoginInfo {
  email: string
  password: string
}

export interface RegisterInfo {
  email: string
  password: string
  firstname: string
  lastname: string
}

export interface TokenRefreshInfo {
  jwt: string
  refreshToken: string
}

export interface LogoutInfo {
  refreshToken: string
}

// Organiser API types
export interface OrganisationItem {
  id: string
  name: string
}

export interface OrganiserContestUpsertRequest {
  name: string
  visibleFrom: string  // ISO 8601 UTC
  openFrom: string      // ISO 8601 UTC
  openTo: string        // ISO 8601 UTC
  bonusTimeStart?: string | null
  bonusTimeEnd?: string | null
  bonusPerMarking: number
  organisationId: string
}

export interface OrganiserContestDetails extends OrganiserContestUpsertRequest {
  id: string
  createdAt: string
  updatedAt: string
}

export interface OrganiserContestClassUpsertRequest {
  name: string
  orderNr: number
  duration: number         // seconds
  maxDuration: number      // seconds
  overDurationUnit: number // seconds
  overDurationPenalty: number // score deducted per unit
}

export interface OrganiserContestClassDetails extends OrganiserContestClassUpsertRequest {
  id: string
  contestId: string
}

export const ECheckPointType = {
  Regular: 1,
  Finish: 2,
  Start: 3,
  NoScore: 4
} as const
export type ECheckPointType = typeof ECheckPointType[keyof typeof ECheckPointType]

export interface OrganiserCheckPointUpsertRequest {
  cpid: string
  cpCode: string
  checkPointType: ECheckPointType
  score: number
  lat: number
  lon: number
}

export interface OrganiserCheckPointDetails extends OrganiserCheckPointUpsertRequest {
  id: string
  contestId: string
}

export interface OrganiserTeamUpsertRequest {
  name: string
  classId: string
  members: string[]  // emails
}

export interface OrganiserTeamDetails {
  id: string
  contestId: string
  name: string
  classId: string
  score: number
  bonus: number
  penalty: number
  finalScore: number
  createdAt: string
}

export interface OrganiserUserTeamItem {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
}

export interface OrganiserMarkingListItem {
  id: string
  userTeamId: string
  checkPointId: string
  cpid: string
  score: number
  dt: string  // ISO 8601 UTC
  lat: number
  lon: number
  teamName: string
  cpCode: string
}

export interface OrganiserMarkingCreateRequest {
  checkPointId: string  // Uses GUID, NOT cpid string (per D-15)
  lat?: number
  lon?: number
  dt?: string
}

export interface OrganiserMarkingDetails extends OrganiserMarkingListItem {}

export interface OrganiserMarkingUpdateRequest {
  score: number
  dt?: string
  lat?: number
  lon?: number
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export const EApiStatusCode = {
  OK: 0,
  DomainError: 1
} as const
export type EApiStatusCode = typeof EApiStatusCode[keyof typeof EApiStatusCode]

export interface MarkingResponse {
  statusOk: boolean
  statusCode: EApiStatusCode
  message: string
  result: any  // UserTeamActivation - use 'any' to avoid circular import
}