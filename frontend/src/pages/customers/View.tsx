import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'
import { displayCustomerName } from '../../types/customer'

export default function CustomerView() {
  const { id } = useParams()
  const nav = useNavigate()
  const [customer, setCustomer] = useState<any>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/customers/${id}`)
        setCustomer(data?.data ?? data)
      } catch {
        setToast('No se pudo cargar la información del cliente')
      }
    })()
  }, [id])

  if (!customer) return <div className="container">Cargando…</div>

  return (
    <div className="container vstack detail-page">
      <div className="page-header">
        <h2 className="page-title">{displayCustomerName(customer)}</h2>
      </div>

      {/* === Datos personales === */}
      <div className="detail-card">
        <div className="detail-section-title">Datos personales</div>
        <div className="detail-group">
          <p><strong>Tipo de documento:</strong> {customer.doc_type || '—'}</p>
          <p><strong>Número:</strong> {customer.doc_number || '—'}</p>
          <p><strong>Email:</strong> {customer.email || '—'}</p>
          <p><strong>Teléfono:</strong> {customer.phone || '—'}</p>
          {customer.alt_phone && (
            <p><strong>Tel. alternativo:</strong> {customer.alt_phone}</p>
          )}
        </div>
      </div>

      {/* === Dirección === */}
      <div className="detail-card">
        <div className="detail-section-title">Dirección</div>
        <div className="detail-group">
          <p><strong>Ciudad:</strong> {customer.city || '—'}</p>
          <p><strong>Domicilio:</strong> {customer.address || '—'}</p>
        </div>
      </div>

      {/* === DNI (frente y dorso) === */}
      {(customer.dni_front_url || customer.dni_back_url) && (
        <div className="detail-card">
          <div className="detail-section-title">Documento Nacional de Identidad</div>
          <div className="photo-gallery">
            {customer.dni_front_url && (
              <div className="photo-item">
                <img src={customer.dni_front_url} alt="Frente DNI" />
                <p>Frente</p>
              </div>
            )}
            {customer.dni_back_url && (
              <div className="photo-item">
                <img src={customer.dni_back_url} alt="Dorso DNI" />
                <p>Dorso</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Observaciones === */}
      {customer.notes && (
        <div className="detail-card">
          <div className="detail-section-title">Notas</div>
          <p>{customer.notes}</p>
        </div>
      )}

      <div className="detail-actions">
        <Button onClick={() => nav(-1)}>Volver</Button>
      </div>

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}
