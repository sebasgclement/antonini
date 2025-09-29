import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import usePagedList from '../../hooks/usePagedList'
import Toast from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import Confirm from '../../components/ui/Confirm'
import Pagination from '../../components/ui/Pagination'

type Vehicle = {
  id: number
  plate: string
  brand: string
  model: string
  year?: number
  vin?: string
  color?: string
  km?: number
  fuel_level?: number
  ownership: 'propio' | 'consignado'
  customer_id?: number | null
  reference_price?: number
  price?: number
  status: 'disponible' | 'reservado' | 'vendido'
  check_spare: boolean
  check_jack: boolean
  check_docs: boolean
  notes?: string
  customer?: { id: number; first_name?: string; last_name?: string; name?: string }
}

export default function VehiclesList() {
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
  } = usePagedList<Vehicle>('/vehicles')

  const [toast, setToast] = useState('')
  const [toDelete, setToDelete] = useState<Vehicle | null>(null)

  const rows = useMemo(() => items, [items])

  const onDelete = async () => {
    if (!toDelete) return
    try {
      await api.delete(`/vehicles/${toDelete.id}`)
      setItems(prev => prev.filter(v => v.id !== toDelete.id))
      if (rows.length === 1 && page > 1) {
        setPage(page - 1)
        setTimeout(refetch, 0)
      }
      setToast('Vehículo eliminado')
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'No se pudo eliminar')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <div className="title">Vehículos</div>
        <Link className="link" to="/vehiculos/registro">+ Nuevo vehículo</Link>
      </div>

      <div className="card hstack" style={{ justifyContent: 'space-between' }}>
        <input
          placeholder="Buscar por patente, marca, modelo…"
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
          <div style={{ padding: 16, color: 'var(--color-danger)' }}>Error: {error}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16, color: 'var(--color-muted)' }}>No hay vehículos.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--color-muted)' }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Patente</th>
                <th style={{ padding: 8 }}>Marca / Modelo</th>
                <th style={{ padding: 8 }}>Año</th>
                <th style={{ padding: 8 }}>Propiedad</th>
                <th style={{ padding: 8 }}>Cliente</th>
                <th style={{ padding: 8 }}>Km</th>
                <th style={{ padding: 8 }}>Combustible</th>
                <th style={{ padding: 8 }}>Checklist</th>
                <th style={{ padding: 8 }}>Precio Ref.</th>
                <th style={{ padding: 8 }}>Precio</th>
                <th style={{ padding: 8 }}>Estado</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(v => (
                <tr key={v.id} style={{ borderTop: '1px solid #1f2430' }}>
                  <td style={{ padding: 8 }}>{v.id}</td>
                  <td style={{ padding: 8 }}>{v.plate}</td>
                  <td style={{ padding: 8 }}>{v.brand} {v.model}</td>
                  <td style={{ padding: 8 }}>{v.year || '—'}</td>
                  <td style={{ padding: 8 }}>{v.ownership}</td>
                  <td style={{ padding: 8 }}>
                    {v.ownership === 'consignado'
                      ? v.customer?.name || [v.customer?.first_name, v.customer?.last_name].filter(Boolean).join(' ') || `Cliente #${v.customer_id}`
                      : '—'}
                  </td>
                  <td style={{ padding: 8 }}>{v.km?.toLocaleString() || '—'}</td>
                  <td style={{ padding: 8 }}>{v.fuel_level != null ? `${v.fuel_level}%` : '—'}</td>
                  <td style={{ padding: 8 }}>
                    {[
                      v.check_spare ? '🛞' : '—',
                      v.check_jack ? '🛠️' : '—',
                      v.check_docs ? '📄' : '—',
                    ].join(' ')}
                  </td>
                  <td style={{ padding: 8 }}>{v.reference_price?.toLocaleString() || '—'}</td>
                  <td style={{ padding: 8 }}>{v.price?.toLocaleString() || '—'}</td>
                  <td style={{ padding: 8 }}>{v.status}</td>
                  <td style={{ padding: 8 }}>
                    <div className="hstack" style={{ justifyContent: 'flex-end', gap: 8 }}>
                      <Button onClick={() => nav(`/vehiculos/${v.id}/edit`)}>Editar</Button>
                      <Button onClick={() => setToDelete(v)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {toast && <Toast message={toast} type={toast.includes('eliminado') ? 'success' : 'error'} />}

      <Confirm
        open={!!toDelete}
        title="Eliminar vehículo"
        message={<>Vas a eliminar <b>{toDelete?.plate}</b>. Esta acción no se puede deshacer.</>}
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}
