/**
 * Authentication Pinia Store
 * Manages user authentication state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthTokens, LoginCredentials, RegisterData } from '@/types/auth'
import * as authService from '@/services/auth.service'
import { getToken, getRefreshToken, ApiError } from '@/services/api.service'

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
  function initializeAuth(): void {
    const token = getToken()
    const refreshToken = getRefreshToken()

    if (token && refreshToken) {
      // Try to restore user session
      const email = localStorage.getItem('authEmail')
      const expiresAt = localStorage.getItem('authTokenExpiresIn')
      const issuedAt = localStorage.getItem('authTokenIssuedAt')

      if (email && expiresAt && issuedAt) {
        // Check if token is expired
        const expiryDate = new Date(parseInt(expiresAt, 10))
        if (expiryDate <= new Date()) {
          // Token expired, clear tokens and return
          logout()
          return
        }

        user.value = {
          id: '',
          email,
          firstName: null,
          lastName: null,
        }
        tokens.value = {
          token,
          refreshToken,
          expiresAt: expiryDate,
          issuedAt: new Date(parseInt(issuedAt, 10)),
        }
      }
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

      // Store email for session restoration
      localStorage.setItem('authEmail', data.email)

      return true
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        err.data &&
        Array.isArray((err.data as { messages?: string[] }).messages)
      ) {
        error.value = (err.data as { messages: string[] }).messages.join(', ')
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

      // Store email for session restoration
      localStorage.setItem('authEmail', credentials.email)

      return true
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        err.data &&
        Array.isArray((err.data as { messages?: string[] }).messages)
      ) {
        error.value = (err.data as { messages: string[] }).messages.join(', ')
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

  /**
   * Setup storage event listener for multi-tab sync
   */
  function setupStorageListener(): void {
    window.addEventListener('storage', handleStorageEvent)
  }

  /**
   * Remove storage event listener
   */
  function removeStorageListener(): void {
    window.removeEventListener('storage', handleStorageEvent)
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
    setupStorageListener,
    removeStorageListener,
    handleStorageEvent,
  }
})
