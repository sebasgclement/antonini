import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Button from "../components/ui/Button";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { isAdmin, user, logout } = useAuth();

  return (
    <div className="vstack" style={{ height: "100%" }}>
      {/* Botón cerrar solo en mobile */}
      <button className="sidebar-close" onClick={onClose}>
        ✕
      </button>

      <nav className="vstack" style={{ gap: 8 }}>
        <NavLink to="/" end className="nav-link">
          🏠 Inicio
        </NavLink>

        <NavLink to="/clientes" end className="nav-link">
          📇 Clientes
        </NavLink>

        <NavLink to="/vehiculos" className="nav-link">
          🚙 Administración de Vehículos
        </NavLink>

        <NavLink to="/reservas" className="nav-link">
          📅 Reservas de Unidades
        </NavLink>


        {isAdmin && (
          <>
            <hr className="sidebar-separator" />
            <div className="sidebar-section">Administración</div>
            <NavLink to="/admin/usuarios" className="nav-link">
              👤 Usuarios
            </NavLink>
            <NavLink to="/admin/roles" className="nav-link">
              🔑 Roles
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer con user/salir en mobile */}
      <div className="sidebar-footer">
        <span style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
          {user?.name || user?.email}
        </span>
        <Button onClick={logout}>Salir</Button>
      </div>
    </div>
  );
}
