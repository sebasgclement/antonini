import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../lib/api'
import Toast from '../../../components/ui/Toast'
import UserForm from './UserForm'
import Button from '../../../components/ui/Button'

export default function UsersCreate() {
  const nav = useNavigate()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const handleSubmit = async (payload: { name: string; email: string; password?: string; role: string }) => {
    try {
      setSaving(true)
      await api.post('/admin/users', payload)
      nav('/admin/usuarios')
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'Error creando usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="vstack" style={{ gap: 20 }}>
      
      {/* Header */}
      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="title" style={{margin: 0}}>Nuevo Usuario</div>
        <Button onClick={() => nav('/admin/usuarios')} style={{background: 'transparent', color: 'var(--color-muted)', border: 'none'}}>
            Cancelar
        </Button>
      </div>

      {/* Formulario (El UserForm ya trae sus propias Cards ahora, así que sacamos la card contenedora de acá para evitar doble borde) */}
      <UserForm onSubmit={handleSubmit} submitting={saving} />

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}