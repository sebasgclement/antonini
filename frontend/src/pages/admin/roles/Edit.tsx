import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../../lib/api'
import Toast from '../../../components/ui/Toast'
import RoleForm from './Form'
import Button from '../../../components/ui/Button'

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

  if (loading) return <div className="container" style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)' }}>Cargando datos...</div>

  return (
    <div className="vstack" style={{ gap: 20 }}>
      
      {/* Header */}
      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="title" style={{margin: 0}}>Editar Rol #{id}</div>
        <Button onClick={() => nav('/admin/roles')} style={{background: 'transparent', color: 'var(--color-muted)', border: 'none'}}>
            Cancelar
        </Button>
      </div>

      <RoleForm initial={initial ?? {}} onSubmit={handleSubmit} submitting={saving} isEdit />

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}