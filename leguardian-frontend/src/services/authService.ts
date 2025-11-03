import type { AuthResponse, User } from '../types'
import apiClient from './api'


export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/mobile/auth/login', {
      email,
      password,
    })
    return response.data
  },

  async register(data: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }): Promise<AuthResponse> {
    const response = await apiClient.post('/mobile/auth/register', data)
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/mobile/auth/logout')
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/mobile/user')
    return response.data
  },

  setToken(token: string): void {
    localStorage.setItem('auth_token', token)
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },
}
