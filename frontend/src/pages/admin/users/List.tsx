import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../../lib/api'
import usePagedList from '../../../hooks/usePagedList'
import Toast from '../../../components/ui/Toast'
import Button from '../../../components/ui/Button'
import Confirm from '../../../components/ui/Confirm'
import Pagination from '../../../components/ui/Pagination'

type RoleObj = { id: number; name: string }
export type User = {
  id: number
  name: string
  email: string
  role?: string | null
  roles?: (string | RoleObj)[] | null
}

function readRoleName(r: any): string {
  if (!r) return ''
  if (typeof r === 'string') return r
  if (typeof r === 'object') return String(r.name ?? r.rol ?? r.role ?? '')
  return String(r)
}

export default function UsersList() {
  const nav = useNavigate()

  const {
    items,
    setItems,
    loading,
    error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    refetch,
  } = usePagedList<User>('/admin/users')

  const [toast, setToast] = useState('')
  const [toDelete, setToDelete] = useState<User | null>(null)

  const rows = useMemo(() => items, [items])

  const onDelete = async () => {
    if (!toDelete) return
    try {
      await api.delete(`/admin/users/${toDelete.id}`)

      // actualizar grilla local
      setItems(prev => prev.filter(u => u.id !== toDelete.id))

      // si eliminamos el último de la página, retroceder
      if (rows.length === 1 && page > 1) {
        setPage(page - 1)
        setTimeout(refetch, 0)
      }

      setToast('Usuario eliminado')
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'No se pudo eliminar')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <div className="title">Usuarios</div>
        <Link className="link" to="/admin/usuarios/crear">+ Nuevo</Link>
      </div>

      <div className="card hstack" style={{ justifyContent: 'space-between' }}>
        <input
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          style={{
            background: '#0c0f14',
            color: 'var(--color-text)',
            border: '1px solid #252b37',
            borderRadius: 10,
            padding: '10px 12px',
            width: '100%',
          }}
        />
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 16 }}>Cargando…</div>
        ) : error ? (
          <div style={{ padding: 16, color: 'var(--color-danger)' }}>
            Error: {error}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16, color: 'var(--color-muted)' }}>
            No hay usuarios para mostrar.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--color-muted)' }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Nombre</th>
                <th style={{ padding: 8 }}>Email</th>
                <th style={{ padding: 8 }}>Rol</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => {
                const role =
                  u.role ??
                  (Array.isArray(u.roles) && u.roles.length
                    ? readRoleName(u.roles[0])
                    : '')
                return (
                  <tr key={u.id} style={{ borderTop: '1px solid #1f2430' }}>
                    <td style={{ padding: 8 }}>{u.id}</td>
                    <td style={{ padding: 8 }}>{u.name}</td>
                    <td style={{ padding: 8 }}>{u.email}</td>
                    <td style={{ padding: 8 }}>{role || '—'}</td>
                    <td style={{ padding: 8 }}>
                      <div className="hstack" style={{ justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => nav(`/admin/usuarios/${u.id}/editar`)}>Editar</Button>
                        <Button onClick={() => setToDelete(u)}>Eliminar</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {toast && (
        <Toast
          message={toast}
          type={toast.includes('eliminado') ? 'success' : 'error'}
        />
      )}

      <Confirm
        open={!!toDelete}
        title="Eliminar usuario"
        message={
          <>
            Vas a eliminar <b>{toDelete?.name}</b>. Esta acción no se puede deshacer.
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}
