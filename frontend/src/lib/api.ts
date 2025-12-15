import axios from "axios";

const api = axios.create({
  // ✅ CORREGIDO: Fallback a producción, nunca a localhost
  baseURL:
    import.meta.env.VITE_API_URL || "https://antoniniautomotores.com.ar/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor para token Bearer
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    // Si es 401 (No autorizado) o 419 (Token vencido)
    if (status === 401 || status === 419) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/app/login";
      }
    }
    return Promise.reject(err);
  }
);

console.log("API baseURL:", api.defaults.baseURL);

export default api;
