import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'

export const useAuthStore = defineStore('auth', () => {
  const jwt = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const userName = ref<string | null>(null)
  const userFirstName = ref<string | null>(null)
  const userId = ref<string | null>(null)

  const isAuthenticated = computed(() => !!jwt.value)

  function decodeJwt(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userFirstName.value = payload.firstName ?? null
      userName.value = payload.name 
        ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
        ?? payload.email
        ?? null
      userId.value = payload.sub 
        ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        ?? null
    } catch {
      userFirstName.value = null
      userName.value = null
      userId.value = null
    }
  }

  function hasRole(roleName: string): boolean {
    if (!jwt.value) return false
    try {
      const payload = JSON.parse(atob(jwt.value.split('.')[1]))
      // Check various possible role claim names
      const role = payload.role 
        ?? payload.roles 
        ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
        ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role']
        ?? null
      if (!role) return false
      return Array.isArray(role) ? role.includes(roleName) : role === roleName
    } catch {
      return false
    }
  }

  const isOrganiser = computed(() => hasRole('organiser'))

  async function loadFromStorage(): Promise<void> {
    const jwtRecord = await db.auth.get('jwt')
    const rtRecord = await db.auth.get('refreshToken')
    jwt.value = jwtRecord?.value ?? null
    refreshToken.value = rtRecord?.value ?? null
    if (jwt.value) decodeJwt(jwt.value)
  }

  async function saveToStorage(): Promise<void> {
    if (jwt.value) {
      await db.auth.put({ key: 'jwt', value: jwt.value })
    } else {
      await db.auth.delete('jwt')
    }
    if (refreshToken.value) {
      await db.auth.put({ key: 'refreshToken', value: refreshToken.value })
    } else {
      await db.auth.delete('refreshToken')
    }
  }

  function setTokens(newJwt: string, newRefreshToken: string): void {
    jwt.value = newJwt
    refreshToken.value = newRefreshToken
    decodeJwt(newJwt)
    saveToStorage()
  }

  function clearTokens(): void {
    jwt.value = null
    refreshToken.value = null
    userName.value = null
    userFirstName.value = null
    saveToStorage()
  }

  return { jwt, refreshToken, userName, userFirstName, userId, isAuthenticated, isOrganiser, hasRole, loadFromStorage, setTokens, clearTokens }
})