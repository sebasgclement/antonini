import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../../lib/api'
import Toast from '../../../components/ui/Toast'
import UserForm from './UserForm'

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
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <div className="title">Nuevo usuario</div>
        <Link className="enlace" to="/admin/usuarios">Volver</Link>
      </div>

      {/* Card contenedor como en Clientes */}
      <div className="card vstack" style={{ gap: 16, maxWidth: 800 }}>
        <UserForm onSubmit={handleSubmit} submitting={saving} />
      </div>

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}
