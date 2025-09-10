import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'

// ----- Tipos que matchean tu backend -----
type RoleObj = { id: number; name: string }

export type AuthUser = {
  id: number
  name: string
  email: string
  // el back puede traer 'role' plano o 'roles' como relación
  role?: unknown
  roles?: unknown[] | RoleObj[]
  // ...otros campos si hiciera falta
}

type MeResponse = { ok: boolean; user: AuthUser }
type LoginResponse = { ok: boolean; user: AuthUser; token: string }

// ----- Helpers seguros -----
function readRoleName(input: unknown): string {
  if (!input) return ''
  if (typeof input === 'string') return input
  if (typeof input === 'object') {
    const o = input as Record<string, unknown>
    const cand = o.name ?? o.nombre ?? o.role ?? o.rol ?? o.slug ?? o.id
    return cand != null ? String(cand) : ''
  }
  return String(input)
}

function normalizeRolesFromUser(user: AuthUser | null): string[] {
  if (!user) return []
  const set = new Set<string>()

  // role “sueltito”
  if (user.role !== undefined) {
    const r = readRoleName(user.role).trim()
    if (r) set.add(r.toLowerCase())
  }

  // roles[] como relación (strings u objetos {id,name})
  if (Array.isArray(user.roles)) {
    for (const it of user.roles) {
      const r = readRoleName(it).trim()
      if (r) set.add(r.toLowerCase())
    }
  }

  return Array.from(set)
}

// Extrae el usuario desde respuestas envueltas o no
function extractUser(payload: any): AuthUser | null {
  if (!payload) return null
  // /auth/me => { ok, user }
  if (payload.user && typeof payload.user === 'object') return payload.user as AuthUser
  // por si algún día devuelves el user directo
  if (payload.id && payload.email) return payload as AuthUser
  return null
}

export default function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const saveUser = (u: AuthUser | null) => {
    setUser(u)
    if (u) localStorage.setItem('user', JSON.stringify(u))
    else localStorage.removeItem('user')
  }

  const fetchMe = useCallback(async () => {
    let aborted = false
    try {
      setLoading(true)

      const token = localStorage.getItem('token')
      if (!token) {
        if (!aborted) saveUser(null)
        return
      }

      // Render rápido con cache válido (usuario directo, no wrapper)
      const cached = localStorage.getItem('user')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (parsed && parsed.id && parsed.email) {
            if (!aborted) setUser(parsed)
          } else {
            localStorage.removeItem('user')
          }
        } catch {
          localStorage.removeItem('user')
        }
      }

      // Confirmar con el backend
      const { data } = await api.get<MeResponse>('/auth/me')
      const u = extractUser(data)
      if (!aborted) saveUser(u)
    } catch {
      if (!aborted) saveUser(null)
    } finally {
      if (!aborted) setLoading(false)
    }
    return () => { aborted = true }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  // Sincroniza cambios desde otras pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') {
        const val = e.newValue ? JSON.parse(e.newValue) : null
        setUser(val)
      }
      if (e.key === 'token' && !e.newValue) setUser(null)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ---- LOGIN (usa wrapper { ok, user, token }) ----
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    if (data?.token) localStorage.setItem('token', data.token)
    if (data?.user) saveUser(data.user) // guardamos SOLO el usuario plano
    return data.user
  }, [])

  // ---- LOGOUT ----
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    if (location.pathname !== '/login') location.href = '/login'
  }, [])

  // Cálculo de roles e isAdmin
  const roles = normalizeRolesFromUser(user)
  const ADMIN_ALIASES = new Set([
    'admin','administrator','superadmin','super-admin','role_admin','role:admin'
  ])
  const isAdmin = roles.some(r => ADMIN_ALIASES.has(r))
  const isAuthenticated = !!user

  const hasRole = useCallback((role: string) => {
    return roles.includes(role.toLowerCase())
  }, [roles])

  return {
    user,
    roles,
    isAdmin,
    isAuthenticated,
    loading,
    refetchMe: fetchMe,
    hasRole,
    login,
    logout,
  }
}
