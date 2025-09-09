import { NavLink } from 'react-router-dom'

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
  return (
    <aside style={{
      width: 260, padding: 16, background: 'var(--color-card)',
      borderRadius: 'var(--radius)', border: '1px solid #1f2430', height: '100%',
    }}>
      <nav className="vstack" style={{ gap: 8 }}>
        <NavLink to="/" end style={({ isActive }) => active(isActive)}>🏠 Inicio</NavLink>

        {/* match exacto para que /clientes no se active en /clientes/registro */}
        <NavLink to="/clientes" end style={({ isActive }) => active(isActive)}>📇 Clientes</NavLink>

        <NavLink to="/clientes/registro" style={({ isActive }) => active(isActive)}>👤 Registrar cliente</NavLink>

        <NavLink to="/recepciones/nueva" style={({ isActive }) => active(isActive)}>🚗 Recepción de vehículo</NavLink>
      </nav>
    </aside>
  )
}
