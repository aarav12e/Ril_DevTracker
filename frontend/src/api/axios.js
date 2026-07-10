import axios from 'axios'

// In development: baseURL is '' so Vite's dev proxy handles /api/* → localhost:8000
// In production (Azure): VITE_API_URL is set to the Azure App Service URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

// Request interceptor to automatically inject the Bearer token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('dt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  err => Promise.reject(err)
)

// Response interceptor to handle token expiry / unauthenticated access
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dt_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
