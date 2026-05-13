import { api } from '@/api'
import type { JWTResponse, LoginInfo, LogoutInfo, RegisterInfo, TokenRefreshInfo } from '@/types/api'

export const identityApi = {
  async login(credentials: LoginInfo): Promise<JWTResponse> {
    const response = await api.post('/identity/Account/Login', credentials)
    return response.data
  },

  async register(info: RegisterInfo): Promise<JWTResponse> {
    const response = await api.post('/identity/Account/Register', info)
    return response.data
  },

  async logout(refreshToken: string): Promise<void> {
    const payload: LogoutInfo = { refreshToken }
    await api.post('/identity/Account/Logout', payload)
  },

  async refreshToken(info: TokenRefreshInfo): Promise<JWTResponse> {
    const response = await api.post('/identity/Account/RefreshTokenData', info)
    return response.data
  }
}