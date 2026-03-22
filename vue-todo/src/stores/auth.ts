/**
 * Authentication Pinia Store
 * Manages user authentication state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthTokens, LoginCredentials, RegisterData } from '@/types/auth'
import * as authService from '@/services/auth.service'
import { getToken, getRefreshToken, ApiError } from '@/services/api.service'

interface ApiErrorData {
  messages?: string[]
}

function isApiErrorData(data: unknown): data is ApiErrorData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'messages' in data &&
    Array.isArray((data as ApiErrorData).messages)
  )
}

function extractApiErrorMessage(err: unknown): string | null {
  if (err instanceof ApiError && isApiErrorData(err.data)) {
    return err.data.messages!.join(', ')
  }
  return null
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!tokens.value && !!user.value)

  // Actions

  /**
   * Initialize auth state from localStorage
   */
  async function initializeAuth(): Promise<void> {
    const token = getToken()
    const refreshToken = getRefreshToken()

    if (!token || !refreshToken) return

    const email = localStorage.getItem('authEmail')
    const expiresAt = localStorage.getItem('authTokenExpiresIn')
    const issuedAt = localStorage.getItem('authTokenIssuedAt')

    if (!email || !expiresAt || !issuedAt) return

    const expiryDate = new Date(parseInt(expiresAt, 10))

    if (expiryDate > new Date()) {
      // Token still valid, restore session directly
      const firstName = localStorage.getItem('authFirstName')
      const lastName = localStorage.getItem('authLastName')

      user.value = {
        id: '',
        email,
        firstName: firstName || null,
        lastName: lastName || null,
      }
      tokens.value = {
        token,
        refreshToken,
        expiresAt: expiryDate,
        issuedAt: new Date(parseInt(issuedAt, 10)),
      }
      return
    }

    // Token expired, attempt to refresh
    isLoading.value = true
    try {
      const refreshed = await authService.refreshToken()
      if (refreshed) {
        user.value = refreshed.user
        tokens.value = refreshed.tokens
      } else {
        logout()
      }
    } catch {
      logout()
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Register a new user
   */
  async function register(data: RegisterData): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.register(data)

      user.value = response.user
      tokens.value = response.tokens

      // Store user info for session restoration
      localStorage.setItem('authEmail', data.email)
      if (data.firstName) {
        localStorage.setItem('authFirstName', data.firstName)
      }
      if (data.lastName) {
        localStorage.setItem('authLastName', data.lastName)
      }

      return true
    } catch (err: unknown) {
      const apiMessage = extractApiErrorMessage(err)
      if (apiMessage) {
        error.value = apiMessage
      } else if (err instanceof Error) {
        error.value = err.message || 'Registration failed. Please try again.'
      } else {
        error.value = 'Registration failed. Please try again.'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Login user
   */
  async function login(credentials: LoginCredentials): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)

      user.value = response.user
      tokens.value = response.tokens

      // Store user info for session restoration
      localStorage.setItem('authEmail', credentials.email)
      if (response.user.firstName) {
        localStorage.setItem('authFirstName', response.user.firstName)
      }
      if (response.user.lastName) {
        localStorage.setItem('authLastName', response.user.lastName)
      }

      return true
    } catch (err: unknown) {
      const apiMessage = extractApiErrorMessage(err)
      if (apiMessage) {
        error.value = apiMessage
      } else if (err instanceof Error) {
        error.value = err.message || 'Invalid email or password.'
      } else {
        error.value = 'Invalid email or password.'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout user
   */
  function logout(): void {
    authService.logout()
    user.value = null
    tokens.value = null
    error.value = null
    localStorage.removeItem('authEmail')
    localStorage.removeItem('authFirstName')
    localStorage.removeItem('authLastName')
  }

  /**
   * Handle logout from storage event (multi-tab sync)
   */
  function handleStorageEvent(event: StorageEvent): void {
    if (event.key === 'authToken' && event.newValue === null) {
      // Logout detected in another tab
      logout()
    }
  }

  return {
    // State
    user,
    tokens,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    initializeAuth,
    register,
    login,
    logout,
    handleStorageEvent,
  }
})
