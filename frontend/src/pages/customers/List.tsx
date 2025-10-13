import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import usePagedList from '../../hooks/usePagedList'
import Toast from '../../components/ui/Toast'
import Confirm from '../../components/ui/Confirm'
import Pagination from '../../components/ui/Pagination'
import { displayCustomerName, type Customer } from '../../types/customer'

export default function CustomersList() {
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
  } = usePagedList<Customer>('/customers')

  const [toast, setToast] = useState('')
  const [toDelete, setToDelete] = useState<Customer | null>(null)
  const rows = useMemo(() => items, [items])

  const onDelete = async () => {
    if (!toDelete) return
    try {
      await api.delete(`/customers/${toDelete.id}`)
      setItems(prev => prev.filter(c => c.id !== toDelete.id))
      if (rows.length === 1 && page > 1) {
        setPage(page - 1)
        setTimeout(refetch, 0)
      }
      setToast('Cliente eliminado ✅')
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'No se pudo eliminar')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <div className="title">Clientes</div>
        <Link className="enlace" to="/clientes/registro">
          + Nuevo cliente
        </Link>
      </div>

      {/* 🔍 Buscador */}
      <div className="card hstack" style={{ justifyContent: 'space-between' }}>
        <input
          placeholder="Buscar por nombre, email, doc, teléfono…"
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
            No hay clientes.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--color-muted)' }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Cliente</th>
                <th style={{ padding: 8 }}>Documento</th>
                <th style={{ padding: 8 }}>Email</th>
                <th style={{ padding: 8 }}>Teléfono</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid #1f2430' }}>
                  <td style={{ padding: 8 }}>{c.id}</td>
                  <td style={{ padding: 8 }}>{displayCustomerName(c)}</td>
                  <td style={{ padding: 8 }}>
                    {[c.doc_type, c.doc_number].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td style={{ padding: 8 }}>{c.email || '—'}</td>
                  <td style={{ padding: 8 }}>{c.phone || '—'}</td>
                  <td style={{ padding: 8 }}>
                    <div
                      className="hstack"
                      style={{ justifyContent: 'flex-end', gap: 8 }}
                    >
                      {/* 👁 Ver */}
                      <button
                        title="Ver detalles"
                        onClick={() => nav(`/clientes/${c.id}/ver`)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-muted)',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={e =>
                          (e.currentTarget.style.color = 'var(--color-primary)')
                        }
                        onMouseLeave={e =>
                          (e.currentTarget.style.color = 'var(--color-muted)')
                        }
                      >
                        👁
                      </button>

                      {/* ✎ Editar */}
                      <button
                        title="Editar"
                        onClick={() => nav(`/clientes/${c.id}/edit`)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-muted)',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={e =>
                          (e.currentTarget.style.color = 'var(--color-primary)')
                        }
                        onMouseLeave={e =>
                          (e.currentTarget.style.color = 'var(--color-muted)')
                        }
                      >
                        ✎
                      </button>

                      {/* ✖ Eliminar */}
                      <button
                        title="Eliminar"
                        onClick={() => setToDelete(c)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-muted)',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={e =>
                          (e.currentTarget.style.color = 'var(--color-danger)')
                        }
                        onMouseLeave={e =>
                          (e.currentTarget.style.color = 'var(--color-muted)')
                        }
                      >
                        ✖
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        title="Eliminar cliente"
        message={
          <>
            Vas a eliminar{' '}
            <b>{displayCustomerName(toDelete || ({ id: 0 } as Customer))}</b>.  
            Esta acción no se puede deshacer.
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}
