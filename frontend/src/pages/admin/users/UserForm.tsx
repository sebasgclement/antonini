import { useMemo, useState } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import type { AuthUser } from '../../../hooks/useAuth'


type Props = {
  initial?: Partial<AuthUser>
  onSubmit: (payload: { name: string; email: string; password?: string; role: string }) => Promise<void>
  submitting?: boolean
  isEdit?: boolean
}

function readRoleName(r: unknown): string {
  if (!r) return ''
  if (typeof r === 'string') return r
  if (typeof r === 'object') {
    const o = r as Record<string, unknown>
    const cand = o.name ?? o.rol ?? o.role ?? o.slug ?? o.id
    return cand != null ? String(cand) : ''
  }
  return String(r)
}

export default function UserForm({ initial = {}, onSubmit, submitting, isEdit }: Props) {
  const initialRole = useMemo(() => {
    if (initial.role) return String(initial.role)
    if (Array.isArray(initial.roles) && initial.roles.length) return readRoleName(initial.roles[0])
    return 'user'
  }, [initial])

  const [name, setName] = useState(initial.name ?? '')
  const [email, setEmail] = useState(initial.email ?? '')
  const [role, setRole] = useState(initialRole)
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: { name: string; email: string; password?: string; role: string } = {
      name, email, role
    }
    if (!isEdit || password.trim()) payload.password = password
    await onSubmit(payload)
  }

  // Estilo de select para que matchee con <Input/>
  const selectStyle: React.CSSProperties = {
    background: '#0c0f14',
    color: 'var(--color-text)',
    border: '1px solid #252b37',
    borderRadius: 10,
    padding: '10px 12px',
    width: '100%',
    appearance: 'none',
  }

  return (
    <form onSubmit={handleSubmit} className="vstack" style={{ gap: 16 }}>
      <div className="hstack" style={{ gap: 16 }}>
        <Input label="Nombre" value={name} onChange={e => setName(e.currentTarget.value)} required />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.currentTarget.value)} required />
      </div>

      <div className="hstack" style={{ gap: 16 }}>
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '.9rem', color: 'var(--color-muted)', marginBottom: 6 }}>Rol</div>
          <select style={selectStyle} value={role} onChange={e => setRole(e.currentTarget.value)}>
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <Input
          label={isEdit ? 'Password (opcional para cambiar)' : 'Password'}
          type="password"
          value={password}
          onChange={e => setPassword(e.currentTarget.value)}
          required={!isEdit}
        />
      </div>

      <div className="hstack" style={{ justifyContent: 'flex-end' }}>
        <Button type="submit" loading={!!submitting}>
          {submitting ? 'Guardando…' : isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}
