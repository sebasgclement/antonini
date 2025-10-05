import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../../../lib/api'
import Toast from '../../../components/ui/Toast'
import UserForm from './UserForm'                 // ← usa el de esta carpeta
import type { AuthUser } from '../../../hooks/useAuth'

export default function UsersEdit() {
  const { id } = useParams()
  const nav = useNavigate()
  const [initial, setInitial] = useState<Partial<AuthUser> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/admin/users/${id}`)
        const u: AuthUser | null = (data?.user && typeof data.user === 'object') ? data.user : data
        setInitial(u ?? {})
      } catch (e: any) {
        setToast(e?.response?.data?.message || 'No se pudo cargar el usuario')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleSubmit = async (payload: { name: string; email: string; password?: string; role: string }) => {
    try {
      setSaving(true)
      await api.put(`/admin/users/${id}`, payload)
      nav('/admin/usuarios')
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'Error actualizando usuario')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="card" style={{ padding: 16 }}>Cargando…</div>

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <div className="title">Editar usuario</div>
        <Link className="enlace" to="/admin/usuarios">Volver</Link>
      </div>

      <UserForm initial={initial ?? {}} onSubmit={handleSubmit} submitting={saving} isEdit />

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}
