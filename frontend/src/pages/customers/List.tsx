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
    <div className="vstack" style={{ gap: 20 }}>
      
      {/* HEADER */}
      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="title" style={{margin: 0}}>Cartera de Clientes</div>
        <Link className="btn" to="/clientes/registro">
          + Nuevo Cliente
        </Link>
      </div>

      {/* BUSCADOR */}
      <div className="card hstack" style={{ padding: '12px 16px' }}>
        <input
          className="input-search"
          placeholder="🔍 Buscar por nombre, email, DNI o teléfono..."
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1rem', outline: 'none' }}
        />
      </div>

      {/* TABLA */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-muted)' }}>Cargando clientes...</div>
        ) : error ? (
          <div style={{ padding: 20, color: 'var(--color-danger)' }}>Error: {error}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-muted)' }}>
            No se encontraron clientes.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table" style={{marginTop: 0, border: 'none'}}>
              <thead>
                <tr style={{background: 'var(--hover-bg)'}}>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Contacto (Email / Tel)</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id}>
                    {/* Nombre */}
                    <td>
                        <div style={{fontWeight: 600, color: 'var(--color-text)', fontSize: '1rem'}}>
                            {displayCustomerName(c)}
                        </div>
                        {/* Si tiene condición fiscal o algo extra, iría acá */}
                    </td>

                    {/* Documento */}
                    <td>
                        <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                            <span style={{fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', border: '1px solid var(--color-border)', padding: '2px 4px', borderRadius: 4}}>
                                {c.doc_type || 'DOC'}
                            </span>
                            <span style={{fontWeight: 500}}>{c.doc_number || '—'}</span>
                        </div>
                    </td>

                    {/* Contacto Unificado */}
                    <td>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                            {c.email && (
                                <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem'}}>
                                    <span style={{opacity: 0.6}}>✉️</span> {c.email}
                                </div>
                            )}
                            {c.phone && (
                                <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--color-muted)'}}>
                                    <span style={{opacity: 0.6}}>📞</span> {c.phone}
                                </div>
                            )}
                            {!c.email && !c.phone && <span style={{opacity: 0.5}}>—</span>}
                        </div>
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="hstack" style={{ justifyContent: 'flex-end', gap: 4 }}>
                        
                        <button
                          className="action-btn"
                          title="Ver detalles"
                          onClick={() => nav(`/clientes/${c.id}/ver`)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>

                        <button
                          className="action-btn"
                          title="Editar"
                          onClick={() => nav(`/clientes/${c.id}/edit`)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>

                        <button
                          className="action-btn danger"
                          title="Eliminar"
                          onClick={() => setToDelete(c)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
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
        title="Eliminar cliente"
        message={
          <>
            ¿Estás seguro de eliminar a <b>{displayCustomerName(toDelete || ({ id: 0 } as Customer))}</b>?
            <br/><br/>
            <small style={{color: 'var(--color-danger)'}}>Se borrará su historial. Esta acción no se puede deshacer.</small>
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}