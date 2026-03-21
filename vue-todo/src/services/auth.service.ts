/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import api, { setTokens } from './api.service'
import type { AuthResponse, JwtResponse, LoginCredentials, RegisterData } from '@/types/auth'

// Default token expiration (1 hour in seconds)
const DEFAULT_EXPIRES_IN = 3600

/**
 * Register a new user account
 */
export async function register(
  data: RegisterData,
  expiresInSeconds: number = DEFAULT_EXPIRES_IN,
): Promise<AuthResponse> {
  const request = {
    email: data.email,
    password: data.password,
    ...(data.firstName && { firstName: data.firstName }),
    ...(data.lastName && { lastName: data.lastName }),
  }

  const response = await api.post<JwtResponse>(
    `/Account/Register?expiresInSeconds=${expiresInSeconds}`,
    request,
  )

  // Store tokens
  setTokens(response, expiresInSeconds)

  // Create user from response
  const user = {
    id: response.id || '',
    email: data.email,
    firstName: response.firstName,
    lastName: response.lastName,
  }

  // Get token info from storage
  const tokenExpiresAt = localStorage.getItem('authTokenExpiresIn')
  const issuedAt = localStorage.getItem('authTokenIssuedAt')

  const tokens = {
    token: response.token,
    refreshToken: response.refreshToken,
    expiresAt: new Date(parseInt(tokenExpiresAt || '0', 10)),
    issuedAt: new Date(parseInt(issuedAt || '0', 10)),
  }

  return { user, tokens }
}

/**
 * Login with email and password
 */
export async function login(
  credentials: LoginCredentials,
  expiresInSeconds: number = DEFAULT_EXPIRES_IN,
): Promise<AuthResponse> {
  const response = await api.post<JwtResponse>(
    `/Account/Login?expiresInSeconds=${expiresInSeconds}`,
    credentials,
  )

  // Store tokens
  setTokens(response, expiresInSeconds)

  // Create user from response
  const user = {
    id: response.id || '',
    email: credentials.email,
    firstName: response.firstName,
    lastName: response.lastName,
  }

  // Get token info from storage
  const tokenExpiresAt = localStorage.getItem('authTokenExpiresIn')
  const issuedAt = localStorage.getItem('authTokenIssuedAt')

  const tokens = {
    token: response.token,
    refreshToken: response.refreshToken,
    expiresAt: new Date(parseInt(tokenExpiresAt || '0', 10)),
    issuedAt: new Date(parseInt(issuedAt || '0', 10)),
  }

  return { user, tokens }
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<AuthResponse | null> {
  const currentToken = localStorage.getItem('authToken')
  const refreshToken = localStorage.getItem('authRefreshToken')

  if (!currentToken || !refreshToken) {
    return null
  }

  try {
    const response = await api.post<JwtResponse>(
      `/Account/RefreshToken?expiresInSeconds=${DEFAULT_EXPIRES_IN}`,
      {
        jwt: currentToken,
        refreshToken: refreshToken,
      },
    )

    // Store new tokens
    setTokens(response, DEFAULT_EXPIRES_IN)

    // Get user info from response
    const email = localStorage.getItem('authEmail') || ''

    const user = {
      id: response.id || '',
      email,
      firstName: response.firstName,
      lastName: response.lastName,
    }

    const tokenExpiresAt = localStorage.getItem('authTokenExpiresIn')
    const issuedAt = localStorage.getItem('authTokenIssuedAt')

    const tokens = {
      token: response.token,
      refreshToken: response.refreshToken,
      expiresAt: new Date(parseInt(tokenExpiresAt || '0', 10)),
      issuedAt: new Date(parseInt(issuedAt || '0', 10)),
    }

    return { user, tokens }
  } catch {
    return null
  }
}

/**
 * Logout (client-side only - clears tokens)
 */
export function logout(): void {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authRefreshToken')
  localStorage.removeItem('authTokenIssuedAt')
  localStorage.removeItem('authTokenExpiresIn')
  localStorage.removeItem('authEmail')
}
