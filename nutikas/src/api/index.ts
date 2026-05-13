import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

api.interceptors.request.use(
  (config) => {
    const auth = useAuthStore()
    if (auth.jwt) {
      config.headers.Authorization = `Bearer ${auth.jwt}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const auth = useAuthStore()

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/identity/Account/RefreshTokenData`,
          {
            jwt: auth.jwt,
            refreshToken: auth.refreshToken
          }
        )

        const { jwt: newJwt, refreshToken: newRefreshToken } = response.data
        auth.setTokens(newJwt, newRefreshToken)

        onTokenRefreshed(newJwt)
        isRefreshing = false

        originalRequest.headers.Authorization = `Bearer ${newJwt}`
        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        auth.clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)