import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import usePagedList from '../../hooks/usePagedList'
import Toast from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'

type Reservation = {
  id: number
  date: string
  status: 'pendiente' | 'confirmada' | 'anulada' | 'vendido'
  price: number
  deposit?: number
  payment_method?: string
  comments?: string
  vehicle?: { id: number; plate: string; brand: string; model: string }
  customer?: { id: number; first_name: string; last_name: string }
  seller?: { id: number; name: string }
}

export default function ReservationsList() {
  const nav = useNavigate()
  const {
    items,
    loading,
    error,
    page,
    setPage,
    totalPages,
    refetch, // viene de usePagedList
  } = usePagedList<Reservation>('/reservations')

  const [toast, setToast] = useState('')
  const rows = useMemo(() => items, [items])

  // 🧠 Refrescar automáticamente al montar o al cambiar de página
  useEffect(() => {
    refetch()
  }, [page])

  // 🌙 Refrescar también cuando el usuario vuelve a la pestaña
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refetch()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [refetch])

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="title">Reservas</div>
        <Link className="enlace" to="/reservas/nueva">+ Nueva reserva</Link>
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
            No hay reservas.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--color-muted)' }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Fecha</th>
                <th style={{ padding: 8 }}>Vehículo</th>
                <th style={{ padding: 8 }}>Cliente</th>
                <th style={{ padding: 8 }}>Vendedor</th>
                <th style={{ padding: 8 }}>Precio</th>
                <th style={{ padding: 8 }}>Seña</th>
                <th style={{ padding: 8 }}>Estado</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #1f2430' }}>
                  <td style={{ padding: 8 }}>{r.id}</td>
                  <td style={{ padding: 8 }}>{new Date(r.date).toLocaleDateString()}</td>
                  <td style={{ padding: 8 }}>
                    {r.vehicle
                      ? `${r.vehicle.brand} ${r.vehicle.model} (${r.vehicle.plate})`
                      : '—'}
                  </td>
                  <td style={{ padding: 8 }}>
                    {r.customer
                      ? `${r.customer.first_name} ${r.customer.last_name}`
                      : '—'}
                  </td>
                  <td style={{ padding: 8 }}>{r.seller?.name || '—'}</td>
                  <td style={{ padding: 8 }}>{r.price?.toLocaleString() || '—'}</td>
                  <td style={{ padding: 8 }}>{r.deposit?.toLocaleString() || '—'}</td>
                  <td style={{ padding: 8 }}>
                    <span
                      style={{
                        color:
                          r.status === 'vendido'
                            ? 'var(--color-success)'
                            : r.status === 'anulada'
                            ? 'var(--color-danger)'
                            : 'var(--color-warning)',
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    <Button onClick={() => nav(`/reservas/${r.id}`)}>Ver</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {toast && <Toast message={toast} />}
    </div>
  )
}
