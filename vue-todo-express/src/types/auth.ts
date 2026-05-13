/**
 * TypeScript interfaces for User Authentication
 * Based on taltech.akaver.com API contracts
 */

// User entity
export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

// Authentication tokens
export interface AuthTokens {
  token: string
  refreshToken: string
  expiresAt: Date
  issuedAt: Date
}

// Auth state managed by Pinia store
export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Login credentials
export interface LoginCredentials {
  email: string
  password: string
}

// Registration data
export interface RegisterData {
  email: string
  password: string
  passwordConfirm: string
  firstName?: string
  lastName?: string
}

// Auth response from API
export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

// JWT response from taltech API
export interface JwtResponse {
  token: string
  refreshToken: string
  firstName: string | null
  lastName: string | null
  id?: string
}

// API error response
export interface ApiError {
  messages: string[]
}

// Refresh token request
export interface RefreshTokenRequest {
  jwt: string
  refreshToken: string
}
