import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";

type HeaderProps = {
  onToggleSidebar?: () => void;
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigate();

  return (
    <header>
      <div className="hstack">
        {/* Menú hamburguesa visible solo en mobile */}
        <button className="btn menu-toggle" onClick={onToggleSidebar}>
          ☰
        </button>
        <Logo />
      </div>

      {/* Bloque solo en desktop */}
      <div className="hstack header-right">
        {/* Menú de usuario */}
        <div className="user-menu">
          <button
            className="user-button"
            onClick={() => setMenuOpen((p) => !p)}
          >
            <div className="avatar-circle">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="user-name">
              {user?.name || user?.email}
            </span>
            <span className="chevron">{menuOpen ? "▲" : "▼"}</span>
          </button>

          {menuOpen && (
            <div className="user-dropdown">
              <button onClick={() => nav("/perfil/password")}>
                🔒 Cambiar contraseña
              </button>
              <button onClick={logout}>🚪 Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
