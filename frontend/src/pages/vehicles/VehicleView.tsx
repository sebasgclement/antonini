import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import api from "../../lib/api";

// Helper para mostrar datos tipo "Label: Valor"
const DataItem = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--color-text)' }}>{value}</span>
    {sub && <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{sub}</span>}
  </div>
);

export default function VehicleView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [vehicle, setVehicle] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/vehicles/${id}`);
        setVehicle(data?.data ?? data);

        const expRes = await api.get(`/vehicles/${id}/expenses`);
        const expData = Array.isArray(expRes.data) ? expRes.data : expRes.data?.data || [];
        setExpenses(expData);
      } catch {
        setToast("No se pudo cargar la información del vehículo");
      }
    })();
  }, [id]);

  if (!vehicle) return <div className="container" style={{padding: 20, textAlign: 'center', color: 'var(--color-muted)'}}>Cargando información...</div>;

  // Determinar color del badge de estado
  const statusColor = 
    vehicle.status === 'disponible' ? 'green' : 
    vehicle.status === 'vendido' ? 'red' : 
    vehicle.status === 'reservado' ? 'orange' : 'blue'; // Ofrecido en azul/gris

  return (
    <div className="container vstack detail-page" style={{ gap: 24 }}>
      
      {/* === HEADER === */}
      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="vstack" style={{ gap: 4 }}>
            <div className="hstack" style={{ gap: 12 }}>
                <h2 className="page-title" style={{margin: 0, fontSize: '1.8rem'}}>
                    {vehicle.brand} {vehicle.model}
                </h2>
                <span className={`badge ${statusColor}`} style={{fontSize: '0.9rem'}}>
                    {vehicle.status === 'ofrecido' ? '📞 Ofrecido' : vehicle.status.toUpperCase()}
                </span>
            </div>
            <div className="hstack" style={{ gap: 8, color: 'var(--color-muted)' }}>
                <span>{vehicle.year}</span>
                <span>•</span>
                <span>{vehicle.plate || 'S/Patente'}</span>
            </div>
        </div>
        <Button onClick={() => nav(-1)} style={{background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)'}}>
            ← Volver
        </Button>
      </div>

      {/* === GRID PRINCIPAL === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        
        {/* COLUMNA 1: Datos Técnicos */}
        <div className="card vstack" style={{ gap: 20 }}>
            <div className="title" style={{fontSize: '1.1rem'}}>Ficha Técnica</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <DataItem label="Dominio" value={vehicle.plate || "—"} />
                <DataItem label="VIN / Chasis" value={vehicle.vin || "—"} />
                <DataItem label="Color" value={vehicle.color || "—"} />
                <DataItem label="Kilometraje" value={vehicle.km ? `${vehicle.km.toLocaleString()} km` : "—"} />
                <DataItem label="Combustible" value={vehicle.fuel_type || "—"} />
                <DataItem label="Año" value={vehicle.year || "—"} />
            </div>
        </div>

        {/* COLUMNA 2: Comercial y Propiedad */}
        <div className="card vstack" style={{ gap: 20 }}>
            <div className="title" style={{fontSize: '1.1rem'}}>Datos Comerciales</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <DataItem 
                    label="Precio de Venta" 
                    value={vehicle.price ? `$ ${vehicle.price.toLocaleString()}` : "Consultar"} 
                    sub="Precio sugerido al público"
                />
                <DataItem 
                    label="Precio Referencia" 
                    value={vehicle.reference_price ? `$ ${vehicle.reference_price.toLocaleString()}` : "—"} 
                />
                <DataItem 
                    label="Valor de Toma" 
                    value={vehicle.take_price ? `$ ${vehicle.take_price.toLocaleString()}` : "—"} 
                />
            </div>

            <hr style={{borderColor: 'var(--color-border)', margin: 0}} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <DataItem 
                    label="Propiedad" 
                    value={
                        <span className={`badge ${vehicle.ownership === 'propio' ? 'purple' : 'blue'}`}>
                            {vehicle.ownership.toUpperCase()}
                        </span>
                    } 
                />
                {vehicle.ownership === "consignado" && (
                    <DataItem 
                        label="Cliente / Dueño" 
                        value={vehicle.customer?.name || `${vehicle.customer?.first_name || ''} ${vehicle.customer?.last_name || ''}` || '—'} 
                        sub={`ID: #${vehicle.customer_id}`}
                    />
                )}
            </div>
        </div>
      </div>

      {/* === CHECKLIST (Horizontal Visual) === */}
      <div className="card">
        <div className="title" style={{fontSize: '1.1rem', marginBottom: 16}}>Estado de Recepción</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
                { label: 'Auxilio', val: vehicle.check_spare },
                { label: 'Crique', val: vehicle.check_jack },
                { label: 'Herramientas', val: vehicle.check_tools },
                { label: 'Manuales', val: vehicle.check_manual },
                { label: 'Duplicado', val: vehicle.check_key_copy },
                { label: 'Documentación', val: vehicle.check_docs },
            ].map((item, i) => (
                <div key={i} style={{ 
                    display: 'flex', alignItems: 'center', gap: 8, 
                    padding: '8px 12px', borderRadius: 8, 
                    background: item.val ? 'rgba(34, 197, 94, 0.1)' : 'var(--input-bg)',
                    border: `1px solid ${item.val ? 'transparent' : 'var(--color-border)'}`,
                    opacity: item.val ? 1 : 0.6
                }}>
                    <span>{item.val ? '✅' : '❌'}</span>
                    <span style={{fontWeight: 500, fontSize: '0.9rem'}}>{item.label}</span>
                </div>
            ))}
        </div>
        {vehicle.notes && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--input-bg)', borderRadius: 8, fontSize: '0.95rem', color: 'var(--color-muted)' }}>
                📝 <strong>Observaciones:</strong> {vehicle.notes}
            </div>
        )}
      </div>

      {/* === GASTOS === */}
      <div className="card">
        <div className="hstack" style={{justifyContent: 'space-between'}}>
            <div className="title" style={{fontSize: '1.1rem', margin: 0}}>Gastos de Taller</div>
            <Button onClick={() => nav(`/vehiculos/${id}/gastos`)} style={{padding: '6px 12px', fontSize: '0.85rem'}}>
                Gestionar Gastos
            </Button>
        </div>
        
        {expenses.length === 0 ? (
          <p className="text-muted" style={{marginTop: 12, fontStyle: 'italic'}}>No hay gastos registrados.</p>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th style={{textAlign: 'right'}}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, i) => (
                <tr key={i}>
                  <td>{new Date(exp.date || exp.created_at).toLocaleDateString("es-AR")}</td>
                  <td>{exp.description}</td>
                  <td>
                      <span className={`badge ${exp.status === 'pagado' ? 'green' : 'orange'}`}>
                          {exp.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                  </td>
                  <td style={{textAlign: 'right', fontWeight: 600}}>$ {exp.amount?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* === FOTOS === */}
      {/* ... (Podés mantener la galería como estaba o mejorarla con un grid más prolijo) ... */}
      <div className="card">
        <div className="title" style={{fontSize: '1.1rem'}}>Galería de Fotos</div>
        <div className="photo-gallery">
          {[
            { key: "front", label: "Frente" },
            { key: "back", label: "Dorso" },
            { key: "left", label: "Lateral Izq" },
            { key: "right", label: "Lateral Der" },
            { key: "interior_front", label: "Interior Adelante" },
            { key: "interior_back", label: "Interior Atrás" },
            { key: "trunk", label: "Baúl" },
          ].map(({ key, label }) => {
            const url = vehicle[`photo_${key}_url`] || vehicle[`photo_${key}`];
            if (!url) return null;
            return (
                <div className="photo-item" key={key} style={{background: 'var(--bg-color)', border: 'none'}}>
                  <img src={url} alt={label} style={{aspectRatio: '4/3', objectFit: 'cover'}} />
                  <p style={{marginTop: 8, fontSize: '0.85rem', fontWeight: 500}}>{label}</p>
                </div>
            );
          })}
        </div>
        {/* Mensaje si no hay fotos */}
        {!Object.keys(vehicle).some(k => k.startsWith('photo_') && vehicle[k]) && (
            <p className="text-muted" style={{fontStyle: 'italic'}}>Sin fotos cargadas.</p>
        )}
      </div>

      {toast && <Toast message={toast} type="error" />}
    </div>
  );
}