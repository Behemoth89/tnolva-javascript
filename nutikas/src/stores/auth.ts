import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'

export const useAuthStore = defineStore('auth', () => {
  const jwt = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)

  const isAuthenticated = computed(() => !!jwt.value)

  // Load tokens from IndexedDB on store initialization
  async function loadFromStorage(): Promise<void> {
    const jwtRecord = await db.auth.get('jwt')
    const rtRecord = await db.auth.get('refreshToken')
    jwt.value = jwtRecord?.value ?? null
    refreshToken.value = rtRecord?.value ?? null
  }

  // Persist tokens to IndexedDB
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
    saveToStorage()
  }

  function clearTokens(): void {
    jwt.value = null
    refreshToken.value = null
    saveToStorage()
  }

  return { jwt, refreshToken, isAuthenticated, loadFromStorage, setTokens, clearTokens }
})