import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/ui/Logo";
import useAuth from "../hooks/useAuth";

type HeaderProps = {
  onToggleSidebar?: () => void;
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // FIX 1: Cerrar menú al cambiar tema
  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    setMenuOpen(false);
  };

  // Cierre al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // FIX 1: Cerrar menú al navegar
  const handleNavigation = (path: string) => {
    nav(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header className="glass-header">
      <style>{`
        /* === HEADER BASE (Estilo Vidrio) === */
        .glass-header {
          /* Por defecto (Dark): Usamos un tono oscuro semitransparente */
          background: rgba(23, 26, 33, 0.90); /* Coincide con tu --color-card #171a21 */
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          
          height: 70px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        /* FIX 2: TEMA LIGHT - Cambiamos el vidrio a blanco */
        [data-theme="light"] .glass-header {
          background: rgba(255, 255, 255, 0.90); /* Blanco semitransparente */
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        /* === ELEMENTOS INTERNOS === */
        .menu-btn {
          background: transparent;
          border: none;
          color: var(--color-text);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .menu-btn:hover {
          background: var(--hover-bg);
        }

        .user-menu-container {
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
        }

        /* Botón Usuario */
        .user-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: 1px solid transparent;
          padding: 6px 6px 6px 12px;
          border-radius: 50px;
          cursor: pointer;
          color: var(--color-text);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .user-trigger:hover, .user-trigger.active {
          background: var(--hover-bg);
          border-color: var(--color-border);
        }

        .avatar-circle {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-600));
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255,255,255,0.2);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }
        
        .user-name {
          font-weight: 600;
          font-size: 0.95rem;
        }
        
        .user-role {
          font-size: 0.75rem;
          color: var(--color-muted);
          text-transform: capitalize;
        }

        .chevron-icon {
          margin-left: 8px;
          opacity: 0.5;
          transition: transform 0.3s ease;
        }
        .user-trigger.active .chevron-icon {
          transform: rotate(180deg);
        }

        /* === DROPDOWN MENÚ === */
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 12px); /* Separación para evitar solapamiento */
          right: 0;
          width: 240px;
          
          /* Vidrio Dark por defecto */
          background: rgba(23, 26, 33, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          
          border-radius: 16px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: var(--shadow);
          animation: menuEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
          z-index: 1000;
        }

        /* Vidrio Light para Dropdown */
        [data-theme="light"] .dropdown-menu {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        /* Triangulito decorativo */
        .dropdown-menu::before {
          content: '';
          position: absolute;
          top: -6px;
          right: 20px;
          width: 12px;
          height: 12px;
          background: inherit; /* Hereda el color del menú (blanco o negro) */
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          transform: rotate(45deg);
          z-index: -1;
        }
        
        [data-theme="light"] .dropdown-menu::before {
           border-color: rgba(0,0,0,0.1); /* Borde sutil en light */
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: var(--color-text);
          text-align: left;
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .menu-item:hover {
          background: var(--hover-bg);
          transform: translateX(4px);
        }
        
        .menu-item svg {
          opacity: 0.7;
          width: 18px;
          height: 18px;
        }
        .menu-item:hover svg {
          opacity: 1;
          color: var(--color-primary);
        }

        .menu-item.danger:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .menu-item.danger svg {
          color: #ef4444;
        }

        .divider {
          height: 1px;
          background: var(--color-border);
          margin: 6px 12px;
          opacity: 0.5;
        }

        @keyframes menuEnter {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .glass-header {
             padding: 0 16px;
             height: 60px;
          }
          .user-info, .chevron-icon {
            display: none;
          }
          .user-trigger {
            padding: 0;
            border: none;
            background: transparent !important; /* En mobile solo queda el avatar */
          }
          .dropdown-menu {
             right: -10px;
             width: 220px;
          }
          .dropdown-menu::before {
             right: 24px;
          }
        }
      `}</style>

      {/* --- IZQUIERDA --- */}
      <div className="hstack" style={{ gap: 16 }}>
        <button className="menu-btn" onClick={onToggleSidebar}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        <Logo />
      </div>

      {/* --- DERECHA --- */}
      <div className="user-menu-container" ref={menuRef}>
        <button
          className={`user-trigger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen((p) => !p)}
        >
          <div className="avatar-circle">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="user-info">
            <span className="user-name">
              {user?.name?.split(" ")[0] || "Usuario"}
            </span>
            <span className="user-role">Administrador</span>
          </div>

          <svg
            className="chevron-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {menuOpen && (
          <div className="dropdown-menu">
            <div style={{ padding: "8px 16px", marginBottom: 4 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "var(--color-muted)",
                }}
              >
                Conectado como
              </p>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>
                {user?.email}
              </p>
            </div>

            <div className="divider" />

            <button
              className="menu-item"
              onClick={() => handleNavigation("/perfil/password")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Cambiar contraseña
            </button>

            <button className="menu-item" onClick={toggleTheme}>
              {theme === "dark" ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  Modo Claro
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  Modo Oscuro
                </>
              )}
            </button>

            <div className="divider" />

            <button className="menu-item danger" onClick={handleLogout}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
