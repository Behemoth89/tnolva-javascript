/**
 * API Types for the Vue 3 Frontend
 *
 * These TypeScript interfaces match the backend DTOs for the multi-tenant
 * SaaS application with JWT-based authentication.
 */

/**
 * Generic API response wrapper
 * All API responses follow this format from the backend
 */
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  message?: string
}

/**
 * Company association for multi-tenant support
 * Represents a user's role within a specific company
 */
export interface CompanyAssociation {
  companyId: string
  role: 'owner' | 'admin' | 'member'
}

/**
 * User entity
 * Represents the authenticated user with their company associations
 */
export interface User {
  id: string
  email: string
  companies: CompanyAssociation[]
}

/**
 * JWT payload structure
 * Extracted from the access token for UI display
 */
export interface JWTPayload {
  sub: string // User ID
  email: string
  companyId: string | null // Currently selected company
  companies: CompanyAssociation[]
}

/**
 * Login request DTO
 */
export interface LoginRequest {
  email: string
  password: string
  companyId?: string // Optional - for multi-company users
}

/**
 * Register request DTO
 */
export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName?: string // Optional - for new company registration
}

/**
 * Authentication response DTO
 * Contains user info and JWT tokens
 */
export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}
