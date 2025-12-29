import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'

type Role = {
  id: number
  name: string
}

type User = {
  id: number
  name: string
  email: string
  roles?: Role[]   // ⬅️ agregado
}

type AuthContextType = {
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // ⬅️ helper: trae /auth/me para actualizar user (incluye roles)
  const fetchMe = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      // Opción A (baseURL ya tiene /api):
      const { data } = await api.get('/auth/me')
      // Opción B (tu baseURL sin /api): await api.get('/api/auth/me')
      if (data?.ok && data?.user) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } catch {
      // token inválido / expirado
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) setUser(JSON.parse(raw))
    // si hay token, refresco user completo con roles
    fetchMe().finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    // Opción A:
    const { data } = await api.post('/auth/login', { email, password })
    // Opción B: await api.post('/api/auth/login', { ... })

    if (data?.ok && data?.token) {
      localStorage.setItem('token', data.token)
      // guardo user básico que vino del login por si acaso
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
      }
      // inmediatamente traigo /auth/me para incluir roles
      await fetchMe()
    } else {
      throw new Error('Login inválido')
    }
  }

  const logout = async () => {
    try {
      // Opción A:
      await api.post('/auth/logout')
      // Opción B: await api.post('/api/auth/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const isAdmin = useMemo(() => {
    const roles = user?.roles || []
    return roles.some(r => (r.name || '').toLowerCase() === 'admin')
  }, [user])

  const value = useMemo(() => ({ user, loading, isAdmin, login, logout }), [user, loading, isAdmin])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthCtx() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthCtx must be used within AuthProvider')
  return ctx
}
