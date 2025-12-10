import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useNotifications } from "../context/NotificationContext";

// 🔹 Íconos (Mantenemos los mismos)
const Icons = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Clients: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Vehicles: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><circle cx="10" cy="14" r="2"></circle><path d="M20 8h-6V2"></path></svg>,
  Reservations: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Roles: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>,
  Reports: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { isAdmin } = useAuth();
  
  // Consumimos el contexto
  const { pendingReservationsCount } = useNotifications();

  // DEBUG: Si esto imprime un número > 0 en la consola, el código funciona y es solo CSS
  // console.log("📊 Sidebar renderizado. Pendientes:", pendingReservationsCount);

  return (
    <div className="sidebar-inner" style={{  display: 'flex', flexDirection: 'column' }}>
      
      <button className="sidebar-close" onClick={onClose} style={{marginBottom: 20}}>
        <Icons.Close />
      </button>

      <nav style={{ flex: 1 }}>
        <div className="sidebar-section">Menu Principal</div>
        
        <NavLink to="/" end className="nav-link" onClick={onClose}>
          <Icons.Home /> <span>Inicio</span>
        </NavLink>

        <NavLink to="/clientes" className="nav-link" onClick={onClose}>
          <Icons.Clients /> <span>Clientes</span>
        </NavLink>

        <NavLink to="/vehiculos" className="nav-link" onClick={onClose}>
          <Icons.Vehicles /> <span>Vehículos</span>
        </NavLink>

        {/* 🔔 ENLACE CON BADGE */}
        {/* Le agregamos estilo inline 'position: relative' para asegurar que el badge se posicione respecto a este botón */}
        <NavLink 
            to="/reservas" 
            className="nav-link" 
            style={{ position: 'relative' }} 
            onClick={onClose}
        >
          <Icons.Reservations />
          <span>Reservas</span>
          
          {/* El badge solo se muestra si hay > 0 */}
          {pendingReservationsCount > 0 && (
            <span className="nav-badge">
              {pendingReservationsCount > 99 ? '99+' : pendingReservationsCount}
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


    </div>
  );
}