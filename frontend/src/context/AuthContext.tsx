import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'


type User = {
id: number
name: string
email: string
}


type AuthContextType = {
user: User | null
loading: boolean
login: (email: string, password: string) => Promise<void>
logout: () => Promise<void>
}


const AuthContext = createContext<AuthContextType | null>(null)


export function AuthProvider({ children }: { children: React.ReactNode }) {
const [user, setUser] = useState<User | null>(null)
const [loading, setLoading] = useState(true)


useEffect(() => {
const raw = localStorage.getItem('user')
if (raw) setUser(JSON.parse(raw))
setLoading(false)
}, [])


const login = async (email: string, password: string) => {
const { data } = await api.post('/api/auth/login', { email, password })
if (data?.ok && data?.token) {
localStorage.setItem('token', data.token)
if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
setUser(data.user)
} else {
throw new Error('Login inválido')
}
}


const logout = async () => {
try {
await api.post('/api/auth/logout')
} finally {
localStorage.removeItem('token')
localStorage.removeItem('user')
setUser(null)
}
}


const value = useMemo(() => ({ user, loading, login, logout }), [user, loading])
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


export function useAuthCtx() {
const ctx = useContext(AuthContext)
if (!ctx) throw new Error('useAuthCtx must be used within AuthProvider')
return ctx
}