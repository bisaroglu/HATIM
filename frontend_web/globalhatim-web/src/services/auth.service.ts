import apiClient, { tokenStorage } from './api'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data)
    tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken)
    return res.data
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data)
    tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken)
    return res.data
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      tokenStorage.clearTokens()
    }
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me')
    return res.data
  },
}
