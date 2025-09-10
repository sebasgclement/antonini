import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import useAuth from '../hooks/useAuth'

type Props = { children: ReactNode }

export default function AdminRoute({ children }: Props) {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
