import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../../../lib/api'
import Toast from '../../../components/ui/Toast'
import RoleForm from './Form'

export default function RolesEdit() {
  const { id } = useParams()
  const nav = useNavigate()
  const [initial, setInitial] = useState<{ name?: string; description?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/admin/roles/${id}`)
        setInitial(data ?? {})
      } catch (e: any) {
        setToast(e?.response?.data?.message || 'No se pudo cargar el rol')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleSubmit = async (payload: { name: string; description?: string }) => {
    try {
      setSaving(true)
      await api.put(`/admin/roles/${id}`, payload)
      nav('/admin/roles')
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'Error actualizando rol')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="card" style={{ padding: 16 }}>Cargando…</div>

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <div className="title">Editar rol</div>
        <Link className="enlace" to="/admin/roles">Volver</Link>
      </div>

      <RoleForm initial={initial ?? {}} onSubmit={handleSubmit} submitting={saving} isEdit />

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}
