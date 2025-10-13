import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'

export default function VehicleView() {
  const { id } = useParams()
  const nav = useNavigate()
  const [vehicle, setVehicle] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/vehicles/${id}`)
        setVehicle(data?.data ?? data)

        // Si la API no incluye los gastos embebidos, los pedimos aparte
        const expRes = await api.get(`/vehicles/${id}/expenses`)
        const expData = Array.isArray(expRes.data)
        ? expRes.data
        : expRes.data?.data || []
        setExpenses(expData)
      } catch {
        setToast('No se pudo cargar la información del vehículo')
      }
    })()
  }, [id])

  if (!vehicle) return <div className="container">Cargando…</div>

  return (
    <div className="container vstack detail-page">
      <div className="page-header">
        <h2 className="page-title">
          {vehicle.brand} {vehicle.model}
          <span className={`status-badge ${vehicle.status}`}>
            {vehicle.status}
          </span>
        </h2>
      </div>

      {/* === Datos generales === */}
      <div className="detail-card">
        <div className="detail-section-title">Datos generales</div>
        <div className="detail-group">
          <p><strong>Patente:</strong> {vehicle.plate || '—'}</p>
          <p><strong>Año:</strong> {vehicle.year || '—'}</p>
          <p><strong>Color:</strong> {vehicle.color || '—'}</p>
          <p><strong>Kilometraje:</strong> {vehicle.km ? `${vehicle.km.toLocaleString()} km` : '—'}</p>
          <p><strong>Combustible:</strong> {vehicle.fuel_level != null ? `${vehicle.fuel_level}%` : '—'}</p>
        </div>
      </div>

      {/* === Propiedad / Cliente === */}
      <div className="detail-card">
        <div className="detail-section-title">Propiedad / Cliente</div>
        <div className="detail-group">
          <p><strong>Tipo de propiedad:</strong> {vehicle.ownership}</p>
          {vehicle.ownership === 'consignado' && (
            <p>
              <strong>Cliente consignante:</strong>{' '}
              {vehicle.customer?.name ||
                [vehicle.customer?.first_name, vehicle.customer?.last_name]
                  .filter(Boolean)
                  .join(' ') ||
                `#${vehicle.customer_id}`}
            </p>
          )}
          <p><strong>VIN:</strong> {vehicle.vin || '—'}</p>
        </div>
      </div>

      {/* === Valores === */}
      <div className="detail-card">
        <div className="detail-section-title">Valores</div>
        <div className="detail-group">
          <p><strong>Precio de referencia:</strong> {vehicle.reference_price ? `$${vehicle.reference_price.toLocaleString()}` : '—'}</p>
          <p><strong>Precio actual:</strong> {vehicle.price ? `$${vehicle.price.toLocaleString()}` : '—'}</p>
        </div>
      </div>

      {/* === Gastos de taller === */}
      <div className="detail-card">
        <div className="detail-section-title">Gastos de taller</div>

        {expenses.length === 0 ? (
          <p className="text-muted">No hay gastos registrados para este vehículo.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Monto ($)</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, i) => (
                <tr key={i}>
                  <td>{new Date(exp.date || exp.created_at).toLocaleDateString('es-AR')}</td>
                  <td>{exp.description || '—'}</td>
                  <td>{exp.amount ? exp.amount.toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* === Checklist === */}
      <div className="detail-card">
        <div className="detail-section-title">Checklist</div>
        <div className="detail-group checklist">
          <p><strong>Rueda de auxilio:</strong> {vehicle.check_spare ? '✅ Sí' : '❌ No'}</p>
          <p><strong>Gato / criquet:</strong> {vehicle.check_jack ? '✅ Sí' : '❌ No'}</p>
          <p><strong>Documentación:</strong> {vehicle.check_docs ? '✅ Completa' : '❌ Incompleta'}</p>
        </div>
      </div>

      {/* === Fotos === */}
      <div className="detail-card">
        <div className="detail-section-title">Fotos del vehículo</div>
        <div className="photo-gallery">
          {['front', 'back', 'left', 'right'].map(side => {
            const url = vehicle[`photo_${side}_url`] || vehicle[`photo_${side}`]
            return (
              url && (
                <div className="photo-item" key={side}>
                  <img src={url} alt={side} />
                  <p>{side}</p>
                </div>
              )
            )
          })}
        </div>
      </div>

      {/* === Observaciones === */}
      {vehicle.notes && (
        <div className="detail-card">
          <div className="detail-section-title">Observaciones</div>
          <p>{vehicle.notes}</p>
        </div>
      )}

      <div className="detail-actions">
        <Button onClick={() => nav(-1)}>Volver</Button>
      </div>

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}
