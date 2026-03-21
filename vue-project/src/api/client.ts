/**
 * API Client for the Vue 3 Frontend
 *
 * Centralized HTTP client using native Fetch API with JWT auth support
 * and multi-tenant company headers.
 */

import type { ApiResponse } from './types'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * API Client configuration options
 */
export interface ApiClientOptions {
  baseUrl?: string
  timeout?: number
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Request options for the API client
 */
export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
}

/**
 * Centralized API Client for all backend communication
 */
export class ApiClient {
  private baseUrl: string
  private accessToken: string | null = null
  private selectedCompanyId: string | null = null
  private timeout: number = 10000 // Default 10 second timeout
  private isRefreshing: boolean = false // Flag to prevent multiple simultaneous refresh attempts
  private refreshPromise: Promise<boolean> | null = null // Store refresh promise to chain requests

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl =
      options.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'
    this.timeout = options.timeout ?? 10000
  }

  /**
   * Set the access token for authenticated requests
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token
  }

  /**
   * Set the selected company ID for multi-tenant requests
   */
  setSelectedCompany(companyId: string | null): void {
    this.selectedCompanyId = companyId
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return this.accessToken
  }

  /**
   * Get the current selected company ID
   */
  getSelectedCompany(): string | null {
    return this.selectedCompanyId
  }

  /**
   * Refresh the access token using the refresh token
   * Returns true if refresh was successful, false otherwise
   */
  async refreshToken(): Promise<boolean> {
    const authStore = useAuthStore()
    const currentRefreshToken = authStore.refreshToken

    // If no refresh token available, can't refresh
    if (!currentRefreshToken) {
      console.warn('No refresh token available')
      return false
    }

    // If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    // Set refreshing flag and create promise
    this.isRefreshing = true
    this.refreshPromise = this.performTokenRefresh(currentRefreshToken)

    try {
      const success = await this.refreshPromise
      return success
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * Perform the actual token refresh request
   */
  private async performTokenRefresh(refreshTokenValue: string): Promise<boolean> {
    const authStore = useAuthStore()

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      })

      if (!response.ok) {
        // Refresh failed - redirect to login
        console.error('Token refresh failed with status:', response.status)
        await this.handleRefreshFailure()
        return false
      }

      const apiResponse: ApiResponse<{ accessToken: string; refreshToken: string }> =
        await response.json()

      if (!apiResponse.success || !apiResponse.data) {
        console.error('Token refresh failed:', apiResponse.message)
        await this.handleRefreshFailure()
        return false
      }

      // Update tokens in auth store
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = apiResponse.data
      authStore.setTokens(newAccessToken, newRefreshToken)

      console.log('Token refreshed successfully')
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      await this.handleRefreshFailure()
      return false
    }
  }

  /**
   * Handle refresh failure by redirecting to login
   */
  private async handleRefreshFailure(): Promise<void> {
    const authStore = useAuthStore()
    authStore.clearAuth()

    // Navigate to login page
    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    }
  }

  /**
   * Build request headers with auth and company headers
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    }

    // Add Authorization header if token exists
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    // Add X-Company-Id header if company is selected
    if (this.selectedCompanyId) {
      headers['X-Company-Id'] = this.selectedCompanyId
    }

    return headers
  }

  /**
   * Make an HTTP request to the API
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.requestWithRetry<T>(endpoint, options, false)
  }

  /**
   * Make an HTTP request with retry capability after token refresh
   * @param endpoint - API endpoint
   * @param options - Request options
   * @param isRetry - Whether this is a retry after token refresh
   */
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestOptions = {},
    isRetry: boolean = false,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const method = options.method || 'GET'

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    const requestOptions: RequestInit = {
      method,
      headers: this.buildHeaders(options.headers),
      signal: controller.signal,
    }

    // Add body for non-GET requests
    if (options.body && method !== 'GET') {
      requestOptions.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, requestOptions)

      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401) {
        // If this is already a retry, don't attempt refresh again (prevent infinite loop)
        if (isRetry) {
          console.error('Token refresh already attempted, redirecting to login')
          await this.handleRefreshFailure()
          throw new ApiError('Session expired, please login again', 401)
        }

        // Attempt to refresh the token
        const refreshSuccess = await this.refreshToken()

        if (refreshSuccess) {
          // Retry the original request with new token
          console.log('Retrying original request after token refresh')
          return this.requestWithRetry<T>(endpoint, options, true)
        } else {
          // Refresh failed - error already handled in refreshToken
          throw new ApiError('Session expired, please login again', 401)
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        await this.handleError(response)
      }

      // Parse and unwrap the API response
      const apiResponse: ApiResponse<T> = await response.json()

      // Check if response indicates success
      if (!apiResponse.success) {
        throw new ApiError(apiResponse.message || 'Request failed', response.status)
      }

      // Return the unwrapped data
      return apiResponse.data as T
    } catch (error) {
      // Handle abort error (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 0)
      }
      if (error instanceof ApiError) {
        throw error
      }
      // Network error or JSON parse error
      throw new ApiError(error instanceof Error ? error.message : 'Network error', 0)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleError(response: Response): Promise<void> {
    let message = 'An error occurred'
    let code: string | undefined

    try {
      const errorResponse = await response.json()
      message = errorResponse.message || errorResponse.error || message
      code = errorResponse.code
    } catch {
      // If we can't parse the error response, use default messages
      switch (response.status) {
        case 400:
          message = 'Bad request'
          break
        case 401:
          message = 'Unauthorized'
          break
        case 403:
          message = 'Forbidden'
          break
        case 404:
          message = 'Not found'
          break
        case 409:
          message = 'Conflict'
          break
        case 500:
          message = 'Internal server error'
          break
        case 502:
          message = 'Bad gateway'
          break
        case 503:
          message = 'Service unavailable'
          break
        case 504:
          message = 'Gateway timeout'
          break
      }
    }

    throw new ApiError(message, response.status, code)
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

/**
 * Decode JWT token payload without verification
 * Uses atob() to decode the base64-encoded payload
 */
export function decodeJWT(token: string): { payload: Record<string, unknown> } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payloadBase64 = parts[1]
    if (!payloadBase64) {
      return null
    }
    // Handle URL-safe base64
    const payloadJson = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')

    // Decode base64 with proper UTF-8 handling
    const payload = JSON.parse(decodeURIComponent(escape(atob(payloadJson))))
    return { payload }
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()
