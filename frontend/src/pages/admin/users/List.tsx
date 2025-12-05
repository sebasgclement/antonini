import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../../lib/api'
import usePagedList from '../../../hooks/usePagedList'
import Toast from '../../../components/ui/Toast'
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
      setItems(prev => prev.filter(u => u.id !== toDelete.id))
      if (rows.length === 1 && page > 1) {
        setPage(page - 1)
        setTimeout(refetch, 0)
      }
      setToast('Usuario eliminado ✅')
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'No se pudo eliminar')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="vstack" style={{ gap: 20 }}>
      
      {/* HEADER */}
      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="title" style={{margin: 0}}>Gestión de Usuarios</div>
        <Link className="btn" to="/admin/usuarios/crear">
          + Nuevo Usuario
        </Link>
      </div>

      {/* BUSCADOR */}
      <div className="card hstack" style={{ padding: '12px 16px' }}>
        <input
          className="input-search"
          placeholder="🔍 Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1rem', outline: 'none' }}
        />
      </div>

      {/* TABLA */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-muted)' }}>Cargando usuarios...</div>
        ) : error ? (
          <div style={{ padding: 20, color: 'var(--color-danger)' }}>Error: {error}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-muted)' }}>
            No hay usuarios registrados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table" style={{marginTop: 0, border: 'none'}}>
              <thead>
                <tr style={{background: 'var(--hover-bg)'}}>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(u => {
                  const roleName = u.role ?? (Array.isArray(u.roles) && u.roles.length ? readRoleName(u.roles[0]) : '');
                  // Color del badge según rol (Admin = Violeta, Otro = Azul)
                  const roleBadgeClass = roleName.toLowerCase().includes('admin') ? 'purple' : 'blue';

                  return (
                    <tr key={u.id}>
                      {/* Nombre con Avatar (Inicial) */}
                      <td>
                          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                              <div style={{
                                  width: 32, height: 32, borderRadius: '50%', 
                                  background: 'var(--color-border)', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-muted)'
                              }}>
                                  {u.name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{fontWeight: 600, color: 'var(--color-text)'}}>{u.name}</span>
                          </div>
                      </td>
                      
                      {/* Email */}
                      <td>
                          <span style={{color: 'var(--color-muted)'}}>{u.email}</span>
                      </td>
                      
                      {/* Rol con Badge */}
                      <td>
                          {roleName ? (
                              <span className={`badge ${roleBadgeClass}`}>
                                  {roleName}
                              </span>
                          ) : (
                              <span style={{opacity: 0.5}}>—</span>
                          )}
                      </td>
                      
                      {/* Acciones */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="hstack" style={{ justifyContent: 'flex-end', gap: 4 }}>
                          
                          <button
                            className="action-btn"
                            title="Editar"
                            onClick={() => nav(`/admin/usuarios/${u.id}/editar`)}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>

                          <button
                            className="action-btn danger"
                            title="Eliminar"
                            onClick={() => setToDelete(u)}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>

                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {toast && (
        <Toast
          message={toast}
          type={toast.includes('✅') ? 'success' : 'error'}
        />
      )}

      <Confirm
        open={!!toDelete}
        title="Eliminar usuario"
        message={
          <>
            ¿Estás seguro de eliminar a <b>{toDelete?.name}</b>?
            <br/><br/>
            <small style={{color: 'var(--color-danger)'}}>Esta acción no se puede deshacer.</small>
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}