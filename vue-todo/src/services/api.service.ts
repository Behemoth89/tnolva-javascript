/**
 * API Service Base Configuration
 * Fetch-based implementation with token refresh handling
 */

import router from '@/router'

// Base URL for taltech API - from environment variables
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION}`

/**
 * Validates and normalizes an API endpoint path
 * Prevents path traversal attacks by rejecting endpoints containing '..'
 */
function validateEndpoint(endpoint: string): string {
  if (endpoint.includes('..')) {
    throw new ApiError(400, 'Invalid endpoint: path traversal not allowed')
  }
  // Ensure endpoint starts with /
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`
}

// Storage keys
const TOKEN_KEY = 'authToken'
const REFRESH_TOKEN_KEY = 'authRefreshToken'
const TOKEN_ISSUED_AT_KEY = 'authTokenIssuedAt'
const TOKEN_EXPIRES_IN_KEY = 'authTokenExpiresIn'

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiresAt(): Date | null {
  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_IN_KEY)
  if (!expiresAt) return null
  return new Date(expiresAt)
}

/**
 * Check if token needs refresh (< 50% lifetime remaining)
 */
export function shouldRefreshToken(): boolean {
  const expiresAt = getTokenExpiresAt()
  if (!expiresAt) return false

  const now = new Date()
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()

  // Get original expiresIn from storage
  const expiresIn = localStorage.getItem(TOKEN_EXPIRES_IN_KEY)
  if (!expiresIn) return false

  const originalExpiresIn = parseInt(expiresIn, 10)
  const halfLifetime = (originalExpiresIn * 1000) / 2

  // Refresh if less than half the lifetime remaining
  return timeUntilExpiry < halfLifetime && timeUntilExpiry > 0
}

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * Store tokens in localStorage
 * DESIGN CHOICE: Tokens are stored in localStorage rather than httpOnly cookies
 * because this is a client-side SPA consuming an external API (taltech.akaver.com).
 * The API does not support cookie-based auth, so Bearer tokens in localStorage are
 * the accepted pattern for this architecture. XSS risk is mitigated by strict CSP
 * headers and input sanitization on the API side.
 */
export function setTokens(
  response: { token: string; refreshToken: string },
  expiresInSeconds: number = 3600,
): void {
  const now = new Date()
  const issuedAt = now.getTime()
  const expiresAt = now.getTime() + expiresInSeconds * 1000

  localStorage.setItem(TOKEN_KEY, response.token)
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
  localStorage.setItem(TOKEN_ISSUED_AT_KEY, issuedAt.toString())
  localStorage.setItem(TOKEN_EXPIRES_IN_KEY, expiresAt.toString())
}

/**
 * Clear tokens from localStorage
 */
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_ISSUED_AT_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_IN_KEY)
}

/**
 * Refresh the access token
 */
export async function refreshAccessToken(): Promise<{
  token: string
  refreshToken: string
} | null> {
  const token = getToken()
  const refreshToken = getRefreshToken()

  if (!token || !refreshToken) {
    return null
  }

  try {
    const request = {
      jwt: token,
      refreshToken: refreshToken,
    }

    const response = await fetch(`${API_BASE_URL}/Account/RefreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new ApiError(response.status, 'Token refresh failed')
    }

    const data = await response.json()

    // Store new tokens (default 1 hour expiration)
    setTokens(data, 3600)

    return data
  } catch {
    // Refresh failed, clear tokens
    clearTokens()
    return null
  }
}

// Request queue for handling 401 responses
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Make an API request with automatic token refresh on 401
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { signal?: AbortSignal } = {},
  retry = false,
): Promise<T> {
  const token = getToken()
  const validatedEndpoint = validateEndpoint(endpoint)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${validatedEndpoint}`, {
    ...options,
    headers,
    signal: options.signal,
  })

  // Handle 401 - try to refresh token
  if (response.status === 401 && !retry) {
    if (isRefreshing) {
      // Add to queue and wait
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          const newHeaders = {
            ...headers,
            Authorization: `Bearer ${token}`,
          }
          return fetch(`${API_BASE_URL}${validatedEndpoint}`, {
            ...options,
            headers: newHeaders,
          })
        })
        .then((res) => {
          if (!res.ok) {
            throw new ApiError(res.status, 'Request failed after token refresh')
          }
          return res.json() as Promise<T>
        })
        .catch((err) => {
          return Promise.reject(err)
        })
    }

    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()

      if (newToken) {
        processQueue(null, newToken.token)
        // Retry the original request with new token
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${newToken.token}`,
        }
        const retryResponse = await fetch(`${API_BASE_URL}${validatedEndpoint}`, {
          ...options,
          headers: newHeaders,
        })

        if (!retryResponse.ok) {
          throw new ApiError(retryResponse.status, 'Request failed after token refresh')
        }

        return retryResponse.json() as Promise<T>
      } else {
        processQueue(new Error('Token refresh failed'), null)
        // Redirect to login using Vue Router (preserves app state)
        router.push({ name: 'login', query: { redirect: window.location.pathname } })
        throw new ApiError(401, 'Unauthorized - redirecting to login')
      }
    } catch (refreshError) {
      processQueue(refreshError as Error, null)
      clearTokens()
      // Redirect to login using Vue Router (preserves app state)
      router.push({ name: 'login', query: { redirect: window.location.pathname } })
      throw refreshError
    } finally {
      isRefreshing = false
    }
  }

  if (!response.ok) {
    let data: unknown
    let responseText: string | undefined
    try {
      responseText = await response.text()
      data = JSON.parse(responseText)
    } catch {
      data = responseText
    }
    // Log detailed error for debugging
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint: validatedEndpoint,
      method: options.method || 'GET',
      requestData: options.body,
      responseData: data,
      responseText: responseText,
      url: `${API_BASE_URL}${validatedEndpoint}`,
    })
    throw new ApiError(response.status, `Request failed: ${response.statusText}`, data)
  }

  // Handle empty responses (e.g., 204 No Content for DELETE requests)
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

// Convenience methods matching axios-like API
export const api = {
  get: <T>(url: string, options?: RequestInit & { signal?: AbortSignal }): Promise<T> =>
    apiRequest<T>(url, { ...options, method: 'GET' }),

  post: <T>(
    url: string,
    data?: unknown,
    options?: RequestInit & { signal?: AbortSignal },
  ): Promise<T> =>
    apiRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(
    url: string,
    data?: unknown,
    options?: RequestInit & { signal?: AbortSignal },
  ): Promise<T> =>
    apiRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(
    url: string,
    data?: unknown,
    options?: RequestInit & { signal?: AbortSignal },
  ): Promise<T> =>
    apiRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string, options?: RequestInit & { signal?: AbortSignal }): Promise<T> =>
    apiRequest<T>(url, { ...options, method: 'DELETE' }),
}

export default api
