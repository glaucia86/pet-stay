import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  phone: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl?: string
  createdAt: string
  tutor?: {
    id: string
    bio?: string
  }
  host?: {
    id: string
    bio?: string
    isActive: boolean
  }
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials)
    const { accessToken, refreshToken, user } = response.data
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
    }
    
    return { accessToken, refreshToken, user }
  },

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data)
    const { accessToken, refreshToken, user } = response.data
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
    }
    
    return { accessToken, refreshToken, user }
  },

  async logout() {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
    
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/users/me')
      return response.data
    } catch (error) {
      return null
    }
  },

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('accessToken')
  },
}
