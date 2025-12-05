import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'
import { displayCustomerName } from '../../types/customer'

// Reutilizamos el helper visual para mantener consistencia con Vehículos
const DataItem = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--color-text)' }}>{value}</span>
    {sub && <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{sub}</span>}
  </div>
);

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

  if (!customer) return <div className="container" style={{padding: 20, textAlign: 'center', color: 'var(--color-muted)'}}>Cargando...</div>

  // Color del badge según estado civil (opcional, detalle visual)
  const maritalColor = customer.marital_status === 'casado' ? 'purple' : 'blue';

  return (
    <div className="container vstack detail-page" style={{ gap: 24 }}>
      
      {/* === HEADER === */}
      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h2 className="page-title" style={{margin: 0, fontSize: '1.8rem'}}>
                {displayCustomerName(customer)}
            </h2>
            <div style={{color: 'var(--color-muted)', marginTop: 4}}>
                Cliente #{customer.id} • Registrado el {new Date(customer.created_at).toLocaleDateString()}
            </div>
        </div>
        <Button onClick={() => nav(-1)} style={{background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)'}}>
            ← Volver
        </Button>
      </div>

      {/* === GRID PRINCIPAL === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        
        {/* COLUMNA 1: Datos de Identidad */}
        <div className="card vstack" style={{ gap: 20 }}>
            <div className="title" style={{fontSize: '1.1rem'}}>Datos Personales</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <DataItem label="Tipo Documento" value={customer.doc_type || 'DNI'} />
                <DataItem label="Número" value={customer.doc_number || '—'} />
                
                <DataItem label="CUIT / CUIL" value={customer.cuit || '—'} />
                
                <DataItem 
                    label="Estado Civil" 
                    value={
                        customer.marital_status ? (
                            <span className={`badge ${maritalColor}`} style={{textTransform: 'capitalize'}}>
                                {customer.marital_status}
                            </span>
                        ) : '—'
                    } 
                />
            </div>
        </div>

        {/* COLUMNA 2: Contacto y Ubicación */}
        <div className="card vstack" style={{ gap: 20 }}>
            <div className="title" style={{fontSize: '1.1rem'}}>Contacto y Ubicación</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <DataItem 
                    label="Teléfono Principal" 
                    value={customer.phone ? <a href={`tel:${customer.phone}`} style={{color: 'inherit', textDecoration: 'none'}}>{customer.phone}</a> : '—'} 
                />
                <DataItem 
                    label="Teléfono Alternativo" 
                    value={customer.alt_phone || '—'} 
                />
                
                <div style={{ gridColumn: '1 / -1' }}>
                    <DataItem 
                        label="Email" 
                        value={customer.email ? <a href={`mailto:${customer.email}`} style={{color: 'var(--color-primary)', textDecoration: 'none'}}>{customer.email}</a> : '—'} 
                    />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <DataItem 
                        label="Dirección" 
                        value={customer.address || '—'} 
                        sub={customer.city || ''}
                    />
                </div>
            </div>
        </div>
      </div>

      {/* === FOTOS DNI === */}
      {(customer.dni_front_url || customer.dni_back_url) ? (
        <div className="card">
            <div className="title" style={{fontSize: '1.1rem'}}>Documentación Digital</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 10 }}>
                
                {customer.dni_front_url && (
                    <div style={{flex: 1, minWidth: 200, maxWidth: 400}}>
                        <span style={{fontSize: '0.9rem', color: 'var(--color-muted)', display: 'block', marginBottom: 8}}>Frente:</span>
                        <img 
                            src={customer.dni_front_url} 
                            alt="Frente DNI" 
                            style={{width: '100%', borderRadius: 8, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow)'}} 
                        />
                    </div>
                )}

                {customer.dni_back_url && (
                    <div style={{flex: 1, minWidth: 200, maxWidth: 400}}>
                        <span style={{fontSize: '0.9rem', color: 'var(--color-muted)', display: 'block', marginBottom: 8}}>Dorso:</span>
                        <img 
                            src={customer.dni_back_url} 
                            alt="Dorso DNI" 
                            style={{width: '100%', borderRadius: 8, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow)'}} 
                        />
                    </div>
                )}
            </div>
        </div>
      ) : (
        <div className="card" style={{padding: 20, color: 'var(--color-muted)', fontStyle: 'italic'}}>
            Sin documentación adjunta.
        </div>
      )}

      {/* === OBSERVACIONES === */}
      {customer.notes && (
        <div className="card">
          <div className="title" style={{fontSize: '1.1rem'}}>Notas Internas</div>
          <p style={{whiteSpace: 'pre-wrap', lineHeight: 1.6}}>{customer.notes}</p>
        </div>
      )}

      {/* Acciones Footer */}
      <div className="hstack" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
        <Button onClick={() => nav(`/clientes/${customer.id}/edit`)}>
            ✎ Editar Cliente
        </Button>
      </div>

      {toast && <Toast message={toast} type="error" />}
    </div>
  )
}