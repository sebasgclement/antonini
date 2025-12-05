import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Confirm from "../../components/ui/Confirm";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import useAuth from "../../hooks/useAuth";
import usePagedList from "../../hooks/usePagedList";
import api from "../../lib/api";

type Vehicle = {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  vin?: string;
  color?: string;
  km?: number;
  fuel_type?: string;
  ownership: "propio" | "consignado";
  customer_id?: number | null;
  reference_price?: number;
  price?: number;
  // Agregamos 'ofrecido' a los estados posibles para que TypeScript no se queje
  status: "disponible" | "reservado" | "vendido" | "ofrecido"; 
  check_spare: boolean;
  check_jack: boolean;
  check_tools: boolean;
  check_docs: boolean;
  check_key_copy: boolean;
  check_manual: boolean;
  notes?: string;
  has_unpaid_expenses?: boolean;
  customer?: {
    id: number;
    first_name?: string;
    last_name?: string;
    name?: string;
  };
};

export default function VehiclesList() {
  const nav = useNavigate();
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
  } = usePagedList<Vehicle>("/vehicles");

  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  
  // Agregamos "ofrecido" a las secciones abiertas por defecto si querés
  const [openSections, setOpenSections] = useState<string[]>(["disponible", "ofrecido"]);
  const { isAdmin } = useAuth();

  const rows = useMemo(() => items, [items]);

  const toggleSection = (status: string) => {
    setOpenSections((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const onDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/vehicles/${toDelete.id}`);
      setItems((prev) => prev.filter((v) => v.id !== toDelete.id));
      if (rows.length === 1 && page > 1) {
        setPage(page - 1);
        setTimeout(refetch, 0);
      }
      setToast("Vehículo eliminado correctamente ✅");
    } catch (e: any) {
      setToast(e?.response?.data?.message || "No se pudo eliminar el vehículo");
    } finally {
      setToDelete(null);
    }
  };

  const handleUnreserve = async (vehicle: Vehicle) => {
    try {
      // Si era ofrecido, vuelve a ofrecido? Asumimos que vuelve a disponible/stock por defecto
      // Ojo con la lógica acá. Por ahora vuelve a disponible.
      await api.put(`/vehicles/${vehicle.id}`, { status: "disponible" });
      setItems((prev) =>
        prev.map((v) =>
          v.id === vehicle.id ? { ...v, status: "disponible" } : v
        )
      );
      setToast(`Reserva quitada de ${vehicle.plate} ✅`);
    } catch (err: any) {
      setToast(err?.response?.data?.message || "No se pudo quitar la reserva");
    }
  };

  const handleCancelSale = async (vehicle: Vehicle) => {
    try {
      await api.put(`/vehicles/${vehicle.id}`, { status: "disponible" });
      setItems((prev) =>
        prev.map((v) =>
          v.id === vehicle.id ? { ...v, status: "disponible" } : v
        )
      );
      setToast(`Venta de ${vehicle.plate} cancelada ✅`);
    } catch {
      setToast("No se pudo cancelar la venta");
    }
  };

  // Función auxiliar para renderizar la sección (Acordeón)
  const renderSection = (statusFilter: string, title: string, icon: string) => {
    // Filtramos los vehículos de esta sección
    const filtered = rows.filter((v) => {
        // Truco: Si el filtro es "disponible", mostramos tanto stock como ofrecido
        // O podés separarlos en dos acordeones distintos (recomendado).
        // Hagamos secciones separadas: Disponible (Stock), Ofrecido, Reservado, Vendido.
        return v.status === statusFilter;
    });

    if (filtered.length === 0) return null;

    const isOpen = openSections.includes(statusFilter);

    return (
      <div key={statusFilter} style={{ marginBottom: 16 }}>
        {/* Encabezado Acordeón */}
        <button
          onClick={() => toggleSection(statusFilter)}
          className={`accordion-header ${isOpen ? 'active' : ''}`}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{fontSize: '1.2rem'}}>{icon}</span>
            <span>{title} <span style={{opacity: 0.6, fontSize: '0.9em'}}>({filtered.length})</span></span>
          </div>
          <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>

        {/* Contenido (Tabla) */}
        {isOpen && (
          <div className="card" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none', padding: 0, overflowX: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Ubicación / Propiedad</th>
                  <th>Marca / Modelo</th>
                  <th>Año / Km</th>
                  <th>Precio</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    {/* Patente */}
                    <td style={{fontWeight: 600}}>
                        {v.plate || <span style={{opacity: 0.5, fontStyle: 'italic'}}>S/Patente</span>}
                    </td>

                    {/* Badges de Estado */}
                    <td>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start'}}>
                        {/* Badge Ubicación (Solo si es Disponible u Ofrecido, en reservado/vendido ya se sabe) */}
                        {v.status === 'ofrecido' ? (
                            <span className="badge orange">📞 Ofrecido</span>
                        ) : v.status === 'disponible' ? (
                            <span className="badge green">🏠 Stock</span>
                        ) : null}

                        {/* Badge Propiedad */}
                        {v.ownership === 'propio' ? (
                            <span className="badge purple">🏢 Propio</span>
                        ) : (
                            <span className="badge blue">👤 Consignado</span>
                        )}
                      </div>
                    </td>

                    {/* Marca Modelo */}
                    <td>
                      <div style={{fontWeight: 600, color: 'var(--color-text)'}}>{v.brand} {v.model}</div>
                      <div style={{fontSize: '0.85rem', color: 'var(--color-muted)'}}>{v.color}</div>
                    </td>

                    {/* Año Km */}
                    <td>
                      <div>{v.year || "—"}</div>
                      <div style={{fontSize: '0.85rem', color: 'var(--color-muted)'}}>
                        {v.km?.toLocaleString()} km
                      </div>
                    </td>

                    {/* Precio */}
                    <td style={{fontWeight: 600, color: 'var(--color-primary)'}}>
                      {v.price ? `$ ${v.price.toLocaleString()}` : <span style={{color: 'var(--color-muted)'}}>Consultar</span>}
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: "right" }}>
                      <div className="hstack" style={{ justifyContent: "flex-end", gap: 4 }}>
                        
                        <button
                          className="action-btn"
                          title="Ver detalles"
                          onClick={() => nav(`/vehiculos/${v.id}/ver`)}
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>

                        {v.status !== "vendido" && (
                          <button
                            className="action-btn"
                            title="Editar"
                            onClick={() => nav(`/vehiculos/${v.id}/edit`)}
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        )}

                        {/* Botón Gastos o Devolver venta */}
                        {v.status !== "vendido" ? (
                          <button
                            className="action-btn"
                            title="Gastos de taller"
                            onClick={() => nav(`/vehiculos/${v.id}/gastos`)}
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                          </button>
                        ) : (
                          <button
                            className="action-btn"
                            title="Cancelar venta"
                            onClick={() => handleCancelSale(v)}
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
                          </button>
                        )}

                        {/* Botones de Reserva / Venta */}
                        {v.status === "reservado" && (
                          <>
                            <button
                              className="action-btn"
                              title={v.has_unpaid_expenses ? "Hay gastos sin pagar" : "Devolver a stock"}
                              disabled={v.has_unpaid_expenses}
                              onClick={() => handleUnreserve(v)}
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                            </button>

                            <button
                              className="action-btn"
                              title="Confirmar Venta"
                              onClick={async () => {
                                try {
                                  await api.put(`/vehicles/${v.id}`, { status: "vendido" });
                                  setItems((prev) => prev.map((x) => x.id === v.id ? { ...x, status: "vendido" } : x));
                                  setToast(`Vehículo ${v.plate} vendido ✅`);
                                } catch {
                                  setToast("Error al vender");
                                }
                              }}
                              style={{ color: '#22c55e' }}
                            >
                              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                            </button>
                          </>
                        )}

                        {/* Botón Venta Directa / Reservar (Solo si está disponible u ofrecido) */}
                        {(v.status === "disponible" || v.status === "ofrecido") && (
                          <>
                            <button
                              className="action-btn"
                              title="Crear Reserva"
                              onClick={() => nav(`/reservas/nueva?vehicle_id=${v.id}`)}
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </button>
                            
                            <button
                              className="action-btn danger"
                              title={v.ownership === "propio" ? "No eliminar propio" : "Eliminar"}
                              disabled={v.ownership === "propio" || !isAdmin}
                              onClick={() => setToDelete(v)}
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>
                          </>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="vstack" style={{ gap: 20 }}>
      <div className="hstack" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="title" style={{margin: 0}}>Vehículos</div>
        <Link className="btn" to="/vehiculos/registro">
          + Nuevo vehículo
        </Link>
      </div>

      <div className="card hstack" style={{ padding: '12px 16px' }}>
        <input
          className="input-search"
          placeholder="🔍 Buscar por patente, marca, modelo o dueño..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1rem', outline: 'none' }}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)' }}>Cargando vehículos...</div>
        ) : error ? (
          <div style={{ padding: 20, color: "var(--color-danger)" }}>Error: {error}</div>
        ) : rows.length === 0 ? (
          <div className="card" style={{ padding: 30, textAlign: 'center', color: "var(--color-muted)" }}>
            No se encontraron vehículos.
          </div>
        ) : (
          <>
            {/* Renderizamos las secciones por separado para más orden */}
            {renderSection("disponible", "En Stock (Disponibles)", "🏠")}
            {renderSection("ofrecido", "Ofrecidos (Externos)", "📞")}
            {renderSection("reservado", "Reservados", "📅")}
            {renderSection("vendido", "Vendidos Históricos", "✅")}
          </>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") ? "success" : "error"}
        />
      )}

      <Confirm
        open={!!toDelete}
        title="Eliminar vehículo"
        message={
          <>
            ¿Estás seguro de eliminar el vehículo <b>{toDelete?.brand} {toDelete?.model}</b> ({toDelete?.plate || 'Sin patente'})? 
            <br/><br/>
            <small style={{color: 'var(--color-danger)'}}>Esta acción es irreversible.</small>
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />
    </div>
  );
}