import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { identityApi } from '@/api/endpoints/identity'
import type { LoginInfo, RegisterInfo } from '@/types/api'

export function useAuth() {
  const router = useRouter()
  const auth = useAuthStore()

  const error = ref<string>('')
  const isLoading = ref(false)

  async function login(credentials: LoginInfo): Promise<boolean> {
    error.value = ''
    isLoading.value = true
    try {
      const response = await identityApi.login(credentials)
      auth.setTokens(response.jwt, response.refreshToken)
      return true
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function register(info: RegisterInfo): Promise<boolean> {
    error.value = ''
    isLoading.value = true
    try {
      const response = await identityApi.register(info)
      auth.setTokens(response.jwt, response.refreshToken)
      return true
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Registration failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await identityApi.logout(auth.refreshToken!)
    } finally {
      auth.clearTokens()
      router.push('/login')
    }
  }

  return { error, isLoading, login, register, logout }
}