import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../../lib/api'
import Toast from '../../../components/ui/Toast'
import RoleForm from './Form'

export default function RolesCreate() {
  const nav = useNavigate()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const handleSubmit = async (payload: { name: string; description?: string }) => {
    try {
      setSaving(true)
      await api.post('/admin/roles', payload)
      nav('/admin/roles')
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'Error creando rol')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <div className="title">Nuevo rol</div>
        <Link className="enlace" to="/admin/roles">Volver</Link>
      </div>

      <div className="card vstack" style={{ gap: 16, maxWidth: 600 }}>
        <RoleForm onSubmit={handleSubmit} submitting={saving} />
      </div>

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}
