import { useState } from 'react'
import type { User } from '../../../types'

type Props = {
  initial?: Partial<User>
  onSubmit: (payload: { name: string; email: string; password?: string; role: string }) => Promise<void>
  submitting?: boolean
  isEdit?: boolean
}

export default function UserForm({ initial = {}, onSubmit, submitting, isEdit }: Props) {
  const [name, setName] = useState(initial.name ?? '')
  const [email, setEmail] = useState(initial.email ?? '')
  const [role, setRole] = useState(
    (initial.role ? initial.role : (Array.isArray(initial.roles) ? initial.roles?.[0] : 'user')) ?? 'user'
  )
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: { name: string; email: string; password?: string; role: string } = {
      name, email, role
    }
    if (!isEdit || password.trim().length > 0) {
      payload.password = password
    }
    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name} onChange={(e) => setName(e.target.value)} required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Rol</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={role} onChange={(e) => setRole(e.target.value)}
        >
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {isEdit ? 'Password (opcional para cambiar)' : 'Password'}
        </label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={password} onChange={(e) => setPassword(e.target.value)}
          {...(!isEdit ? { required: true } : {})}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!!submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {submitting ? 'Guardando…' : (isEdit ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  )
}
