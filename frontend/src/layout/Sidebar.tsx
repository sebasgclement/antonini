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
        <NavLink to="/" end className="nav-link" onClick={onClose}>
          🏠 Inicio
        </NavLink>

        <NavLink to="/clientes" end className="nav-link" onClick={onClose}>
          📇 Clientes
        </NavLink>

        <NavLink to="/vehiculos" className="nav-link" onClick={onClose}>
          🚙 Administración de Vehículos
        </NavLink>

        <NavLink to="/reservas" className="nav-link" onClick={onClose}>
          📅 Reservas de Unidades
        </NavLink>

        {isAdmin && (
          <>
            <hr className="sidebar-separator" />
            <div className="sidebar-section">Administración</div>
            <NavLink to="/admin/usuarios" className="nav-link" onClick={onClose}>
              👤 Usuarios
            </NavLink>
            <NavLink to="/admin/roles" className="nav-link" onClick={onClose}>
              🔑 Roles
            </NavLink>
            <NavLink to="/admin/reportes" className="nav-link" onClick={onClose}>
              📊 Reportes
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer con usuario + acciones (visible en mobile) */}
      <div className="sidebar-footer">
        <span
          style={{
            color: "var(--color-muted)",
            fontSize: "0.9rem",
            textAlign: "center",
          }}
        >
          {user?.name || user?.email}
        </span>

        {/* 🔒 Cambiar contraseña */}
        <button
          className="btn"
          onClick={() => {
            onClose?.();
            window.location.href = "/perfil/password";
          }}
        >
          🔒 Cambiar contraseña
        </button>

        {/* 🚪 Cerrar sesión */}
        <Button onClick={logout}>🚪 Salir</Button>
      </div>
    </div>
  );
}
