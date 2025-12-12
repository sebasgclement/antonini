// src/lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: { 
    'Accept': 'application/json',
    'Content-Type': 'application/json' // Agregalo por las dudas
  },
  withCredentials: true // 👈 ¡AHORA SÍ! ADENTRO DEL OBJETO
})

// Interceptor para token Bearer
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Ajuste para que redireccione bien a /app/login
      if (!location.pathname.includes('/login')) {
         const base = import.meta.env.BASE_URL; 
         window.location.href = `${base}login`.replace('//', '/');
      }
    }
    return Promise.reject(err)
  }
)

console.log('API baseURL:', api.defaults.baseURL)

export default api