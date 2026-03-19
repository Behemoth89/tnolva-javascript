/**
 * Authentication Store for the Vue 3 Frontend
 *
 * Pinia store for managing authentication state using the
 * JWT-based authentication flow with multi-company support.
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/api/types'
import { decodeJWT } from '@/api/client'
import { apiClient } from '@/api/client'

/**
 * Authentication state store
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedCompanyId = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  // Get list of companies the user belongs to
  const getCompanies = computed(() => user.value?.companies ?? [])

  // Actions

  /**
   * Set access and refresh tokens
   * Also decodes the JWT to populate user info
   */
  function setTokens(newAccessToken: string, newRefreshToken: string): void {
    accessToken.value = newAccessToken
    refreshToken.value = newRefreshToken

    // Update API client with new token
    apiClient.setAccessToken(newAccessToken)

    // Decode JWT to get user info - don't clear auth on decode error
    // since the token is valid even if we can't parse user info
    try {
      decodeAndSetUser(newAccessToken)
    } catch (err) {
      console.error('Failed to decode JWT:', err)
      // Token is valid, just user info failed to parse - don't clear auth
    }
  }

  /**
   * Decode JWT token and populate user state with validation
   */
  function decodeAndSetUser(token: string): void {
    const decoded = decodeJWT(token)
    if (decoded && decoded.payload) {
      const payload = decoded.payload

      // Validate and build companies array with proper type checking
      const companies: User['companies'] = Array.isArray(payload.companies)
        ? payload.companies
            .filter(
              (c): c is { companyId: string; role: 'owner' | 'admin' | 'member' } =>
                c !== null && typeof c === 'object' && 'companyId' in c && 'role' in c,
            )
            .map((c) => ({
              companyId: String(c.companyId),
              role: c.role as 'owner' | 'admin' | 'member',
            }))
        : []

      // Build user object from JWT payload with validated data
      user.value = {
        id: typeof payload.sub === 'string' ? payload.sub : String(payload.sub ?? ''),
        email: typeof payload.email === 'string' ? payload.email : String(payload.email ?? ''),
        companies,
      }

      // Set selected company from token if available and valid
      if (payload.companyId && typeof payload.companyId === 'string') {
        apiClient.setSelectedCompany(payload.companyId)
      }
    } else {
      // Invalid token structure - clear user but keep tokens for retry
      user.value = null
    }
  }

  /**
   * Set user directly
   */
  function setUser(newUser: User | null): void {
    user.value = newUser
  }

  /**
   * Set loading state
   */
  function setLoading(loading: boolean): void {
    isLoading.value = loading
  }

  /**
   * Set error message
   */
  function setError(newError: string | null): void {
    error.value = newError
  }

  /**
   * Clear authentication state (logout)
   */
  function clearAuth(): void {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    error.value = null
    isLoading.value = false

    // Clear API client tokens
    apiClient.setAccessToken(null)
    apiClient.setSelectedCompany(null)
    selectedCompanyId.value = null
  }

  /**
   * Set selected company
   */
  function setSelectedCompany(companyId: string): void {
    selectedCompanyId.value = companyId
    apiClient.setSelectedCompany(companyId)
  }

  /**
   * Auto-select company if user has only one
   */
  function autoSelectCompany(): void {
    const companies = getCompanies.value
    if (companies.length === 1 && companies[0]) {
      setSelectedCompany(companies[0].companyId)
    }
  }

  /**
   * Switch to a different company via API
   */
  async function switchCompany(companyId: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
        '/auth/switch-company',
        { companyId },
      )

      // Update tokens and selected company
      setTokens(response.accessToken, response.refreshToken)
      selectedCompanyId.value = companyId
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to switch company'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    selectedCompanyId,
    // Computed
    isAuthenticated,
    getCompanies,
    // Actions
    setTokens,
    setUser,
    setLoading,
    setError,
    clearAuth,
    setSelectedCompany,
    autoSelectCompany,
    switchCompany,
  }
})
