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