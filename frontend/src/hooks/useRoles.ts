// src/hooks/useRoles.ts
import { useEffect, useState } from 'react'
import api from '../lib/api'

export type Role = { id: number; name: string; description?: string }

export default function useRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/roles')
        setRoles(data?.data ?? [])
      } catch (e) {
        console.error('Error cargando roles', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { roles, loading }
}
