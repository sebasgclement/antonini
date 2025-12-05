import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../lib/api'
import Toast from '../../../components/ui/Toast'
import RoleForm from './Form'
import Button from '../../../components/ui/Button'

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
    <div className="vstack" style={{ gap: 20 }}>
      
      {/* Header */}
      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="title" style={{margin: 0}}>Nuevo Rol</div>
        <Button onClick={() => nav('/admin/roles')} style={{background: 'transparent', color: 'var(--color-muted)', border: 'none'}}>
            Cancelar
        </Button>
      </div>

      {/* Formulario */}
      <RoleForm onSubmit={handleSubmit} submitting={saving} />

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}