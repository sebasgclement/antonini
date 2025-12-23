import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useDolar } from "../context/DolarContext";
import { useNotifications } from "../context/NotificationContext";
import useAuth from "../hooks/useAuth";

// 🔹 Íconos
const Icons = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  // Nuevo ícono para Agenda
  Agenda: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Clients: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Vehicles: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <circle cx="10" cy="14" r="2"></circle>
      <path d="M20 8h-6V2"></path>
    </svg>
  ),
  Reservations: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Roles: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Save: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
  ),
};

// --- SUBCOMPONENTE WIDGET DOLAR ---
const SidebarDolar = () => {
  const { price, isManual, setManualPrice, loading } = useDolar();
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrice, setTempPrice] = useState("");

  const handleEdit = () => {
    setTempPrice(price.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    const val = parseFloat(tempPrice);
    if (!isNaN(val) && val > 0) {
      setManualPrice(val);
    }
    setIsEditing(false);
  };

  const handleReset = () => {
    setManualPrice(null);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        marginTop: "auto",
        marginBottom: 20,
        padding: "12px 14px",
        background: "var(--color-card)",
        borderRadius: 8,
        border: "1px solid var(--border-color)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--color-muted)",
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ letterSpacing: "0.5px" }}>COTIZACIÓN USD</span>
        {isManual && (
          <span style={{ background: "var(--color-warning)", color: "#fff", fontSize: "0.6rem", padding: "1px 4px", borderRadius: 3 }}>
            MANUAL
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="vstack" style={{ gap: 6, width: "100%" }}>
          <input
            type="number"
            autoFocus
            value={tempPrice}
            onChange={(e) => setTempPrice(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--bg-color)",
              border: "1px solid var(--color-primary)",
              color: "var(--text-color)",
              padding: "4px 6px",
              borderRadius: 4,
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <div className="hstack" style={{ gap: 4, width: "100%" }}>
            <button onClick={handleSave} style={{ flex: 1, background: "var(--color-success)", border: 0, borderRadius: 4, cursor: "pointer", padding: "4px 0", color: "white", display: "flex", justifyContent: "center" }} title="Guardar">
              <Icons.Save />
            </button>
            <button onClick={handleReset} style={{ flex: 1, background: "var(--color-muted)", border: 0, borderRadius: 4, cursor: "pointer", padding: "4px 0", color: "white", display: "flex", justifyContent: "center" }} title="Restaurar Automático">
              <Icons.Refresh />
            </button>
          </div>
        </div>
      ) : (
        <div className="hstack" style={{ justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-success)" }}>
            $ {loading ? "..." : (price || 0).toLocaleString("es-AR")}
          </div>
          <button onClick={handleEdit} className="btn-icon-hover" style={{ background: "transparent", border: "none", padding: 4, color: "var(--color-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Icons.Edit />
          </button>
        </div>
      )}
    </div>
  );
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { isAdmin } = useAuth();
  
  // 🟢 AQUI usamos las dos variables (Reservas y Agenda)
  // Asegúrate de que NotificationContext exponga 'agendaCount'
  const { pendingReservationsCount, agendaCount } = useNotifications(); 

  return (
    <div className="sidebar-inner" style={{ display: "flex", flexDirection: "column", height: "100%", overflowX: "hidden" }}>
      <button className="sidebar-close" onClick={onClose} style={{ marginBottom: 20 }}>
        <Icons.Close />
      </button>

      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%", boxSizing: "border-box" }}>
        
        <div className="sidebar-section">Menu Principal</div>

        <NavLink to="/" end className="nav-link" onClick={onClose}>
          <Icons.Home /> <span>Inicio</span>
        </NavLink>

        {/* 🟢 NUEVO: LINK MI AGENDA */}
        {/* Lo dirijo a "/" porque ahí está el Widget, pero si tienes una página dedicada usa "/agenda" */}
        <NavLink 
            to="/" // O a "/mi-agenda" si creas la página
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} 
            onClick={onClose}
            style={{ position: 'relative' }}
        >
          <Icons.Agenda /> 
          <span>Mi Agenda</span>
          {/* Badge para la agenda (Eventos de HOY) */}
          {agendaCount > 0 && (
             <span className="nav-badge" style={{background: '#3b82f6'}}> 
               {agendaCount > 99 ? "99+" : agendaCount}
             </span>
          )}
        </NavLink>

        <NavLink to="/clientes" className="nav-link" onClick={onClose}>
          <Icons.Clients /> <span>Clientes</span>
        </NavLink>

        <NavLink to="/vehiculos" className="nav-link" onClick={onClose}>
          <Icons.Vehicles /> <span>Vehículos</span>
        </NavLink>

        <NavLink to="/reservas" className="nav-link" style={{ position: "relative" }} onClick={onClose}>
          <Icons.Reservations />
          <span>Reservas</span>
          {/* Badge para reservas (Pendientes) */}
          {pendingReservationsCount > 0 && (
            <span className="nav-badge" style={{background: '#ef4444'}}>
              {pendingReservationsCount > 99 ? "99+" : pendingReservationsCount}
            </span>
          )}
        </NavLink>

        {isAdmin && (
          <>
            <hr className="sidebar-separator" />
            <div className="sidebar-section">Administración</div>
            <NavLink to="/admin/usuarios" className="nav-link" onClick={onClose}>
              <Icons.Users /> <span>Usuarios</span>
            </NavLink>
            <NavLink to="/admin/roles" className="nav-link" onClick={onClose}>
              <Icons.Roles /> <span>Roles y Permisos</span>
            </NavLink>
            <NavLink to="/admin/reportes" className="nav-link" onClick={onClose}>
              <Icons.Reports /> <span>Reportes</span>
            </NavLink>
          </>
        )}
      </nav>

      <SidebarDolar />
    </div>
  );
}