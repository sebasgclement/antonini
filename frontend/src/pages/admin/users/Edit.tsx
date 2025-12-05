import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../../lib/api'
import Toast from '../../../components/ui/Toast'
import UserForm from './UserForm'
import Button from '../../../components/ui/Button'
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
        // Normalizamos la respuesta por si viene envuelta en { user: ... } o directo
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

  if (loading) return <div className="container" style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)' }}>Cargando datos...</div>

  return (
    <div className="vstack" style={{ gap: 20 }}>
      
      {/* Header */}
      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="title" style={{margin: 0}}>Editar Usuario #{id}</div>
        <Button onClick={() => nav('/admin/usuarios')} style={{background: 'transparent', color: 'var(--color-muted)', border: 'none'}}>
            Cancelar
        </Button>
      </div>

      {/* Formulario */}
      {/* Ya no envolvemos en <div className="card"> porque UserForm tiene sus propias cards internas */}
      <UserForm initial={initial ?? {}} onSubmit={handleSubmit} submitting={saving} isEdit />

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}