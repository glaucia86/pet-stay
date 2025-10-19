import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, tentar refresh
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          const { accessToken } = response.data
          
          localStorage.setItem('accessToken', accessToken)
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${accessToken}`
          return axios(error.config)
        } catch (refreshError) {
          // Refresh falhou, fazer logout
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/auth/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
