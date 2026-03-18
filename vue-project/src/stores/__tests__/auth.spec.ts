import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('has null user initially', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('has null tokens initially', () => {
      const store = useAuthStore()
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
    })

    it('has isLoading false initially', () => {
      const store = useAuthStore()
      expect(store.isLoading).toBe(false)
    })

    it('has null error initially', () => {
      const store = useAuthStore()
      expect(store.error).toBeNull()
    })

    it('is not authenticated initially', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('setTokens', () => {
    it('updates accessToken and refreshToken', () => {
      const store = useAuthStore()
      store.setTokens('access-token', 'refresh-token')
      expect(store.accessToken).toBe('access-token')
      expect(store.refreshToken).toBe('refresh-token')
    })

    it('sets isAuthenticated to true when tokens and user are set', () => {
      const store = useAuthStore()
      store.setTokens('access-token', 'refresh-token')
      store.setUser({ id: '1', email: 'test@test.com', companies: [] })
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('setUser', () => {
    it('updates user state', () => {
      const store = useAuthStore()
      const user = {
        id: '1',
        email: 'test@example.com',
        companies: [{ companyId: 'comp-1', role: 'owner' as const }],
      }

      store.setUser(user)

      expect(store.user).toEqual(user)
    })

    it('sets user to null', () => {
      const store = useAuthStore()
      store.setUser({ id: '1', email: 'test@test.com', companies: [] })
      store.setUser(null)
      expect(store.user).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('sets isLoading to true', () => {
      const store = useAuthStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading to false', () => {
      const store = useAuthStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('sets error message', () => {
      const store = useAuthStore()
      store.setError('Something went wrong')
      expect(store.error).toBe('Something went wrong')
    })

    it('clears error when set to null', () => {
      const store = useAuthStore()
      store.setError('error')
      store.setError(null)
      expect(store.error).toBeNull()
    })
  })

  describe('clearAuth', () => {
    it('resets all auth state', () => {
      const store = useAuthStore()
      store.setTokens('token', 'refresh')
      store.setUser({ id: '1', email: 'test@test.com', companies: [] })
      store.setError('error')
      store.setLoading(true)

      store.clearAuth()

      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.error).toBeNull()
      expect(store.isLoading).toBe(false)
    })

    it('sets isAuthenticated to false after clear', () => {
      const store = useAuthStore()
      store.setTokens('token', 'refresh')
      store.setUser({ id: '1', email: 'test@test.com', companies: [] })
      store.clearAuth()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('computed isAuthenticated', () => {
    it('is false when there is no access token', () => {
      const store = useAuthStore()
      store.setUser({ id: '1', email: 'test@test.com', companies: [] })
      expect(store.isAuthenticated).toBe(false)
    })

    it('is false when there is no user', () => {
      const store = useAuthStore()
      store.setTokens('token', 'refresh')
      expect(store.isAuthenticated).toBe(false)
    })

    it('is true when both token and user exist', () => {
      const store = useAuthStore()
      store.setTokens('token', 'refresh')
      store.setUser({ id: '1', email: 'test@test.com', companies: [] })
      expect(store.isAuthenticated).toBe(true)
    })
  })
})
