import axios from 'axios'


const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
headers: { 'Accept': 'application/json' }
})


// Interceptor para token Bearer + manejo de 401
api.interceptors.request.use((config) => {
const token = localStorage.getItem('token')
if (token) config.headers.Authorization = `Bearer ${token}`
return config
})


api.interceptors.response.use(
(res) => res,
(err) => {
if (err?.response?.status === 401) {
// limpiar sesión básica y forzar login
localStorage.removeItem('token')
localStorage.removeItem('user')
// Redirección manual si estamos fuera de React Context
if (location.pathname !== '/login') location.href = '/login'
}
return Promise.reject(err)
}
)


export default api