import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Logo from "../components/ui/Logo";

type HeaderProps = {
  onToggleSidebar?: () => void;
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigate();

  // 🌗 Control del tema (persistente en localStorage)
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

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
              <button onClick={toggleTheme}>
                {theme === "dark" ? "🌞 Modo claro" : "🌙 Modo oscuro"}
              </button>
              <button onClick={logout}>🚪 Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
