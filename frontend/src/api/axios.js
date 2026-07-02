import axios from 'axios'

const api = axios.create({ baseURL: '' })

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
