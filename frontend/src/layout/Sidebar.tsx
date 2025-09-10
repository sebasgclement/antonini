// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const linkStyle: React.CSSProperties = {
  display: 'block',
  padding: '10px 14px',
  borderRadius: 10,
  color: 'var(--color-text)',
  textDecoration: 'none',
  border: '1px solid transparent',
}

const active = (isActive: boolean) => ({
  ...linkStyle,
  background: isActive ? '#121620' : 'transparent',
  borderColor: isActive ? '#222836' : 'transparent',
})

export default function Sidebar() {
  const { isAdmin } = useAuth()

  return (
    <aside
      style={{
        width: 260,
        padding: 16,
        background: 'var(--color-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid #1f2430',
        height: '100%',
      }}
    >
      <nav className="vstack" style={{ gap: 8 }}>
        <NavLink to="/" end style={({ isActive }) => active(isActive)}>
          🏠 Inicio
        </NavLink>

        {/* match exacto para que /clientes no se active en /clientes/registro */}
        <NavLink to="/clientes" end style={({ isActive }) => active(isActive)}>
          📇 Clientes
        </NavLink>

        <NavLink to="/recepciones/nueva" style={({ isActive }) => active(isActive)}>
          🚗 Recepción de vehículo
        </NavLink>

        {/* Sección exclusiva de admin */}
        {isAdmin && (
          <>
            <hr style={{ margin: '12px 0', borderColor: '#2a2f3c' }} />
            <div style={{ fontSize: 12, opacity: 0.7, padding: '0 4px' }}>
              Administración
            </div>
            <NavLink
              to="/admin/usuarios"
              style={({ isActive }) => active(isActive)}
            >
              👤 Usuarios
            </NavLink>
            <NavLink
              to="/admin/roles"
              style={({ isActive }) => active(isActive)}
            >
              🔑 Roles
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  )
}
