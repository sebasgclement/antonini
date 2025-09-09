import { NavLink } from 'react-router-dom'


const linkStyle: React.CSSProperties = {
display: 'block', padding: '10px 14px', borderRadius: 10,
color: 'var(--color-text)', textDecoration: 'none', border: '1px solid transparent'
}


export default function Sidebar() {
return (
<aside style={{
width: 260, padding: 16, background: 'var(--color-card)',
borderRadius: 'var(--radius)', border: '1px solid #1f2430', height: '100%'
}}>
<nav className="vstack" style={{ gap: 8 }}>
<NavLink to="/" style={({ isActive }) => ({
...linkStyle, background: isActive ? '#121620' : 'transparent', borderColor: isActive ? '#222836' : 'transparent'
})}>🏠 Inicio</NavLink>
<NavLink to="/clientes/registro" style={({ isActive }) => ({
...linkStyle, background: isActive ? '#121620' : 'transparent', borderColor: isActive ? '#222836' : 'transparent'
})}>👤 Registrar cliente</NavLink>
<NavLink to="/recepciones/nueva" style={({ isActive }) => ({
...linkStyle, background: isActive ? '#121620' : 'transparent', borderColor: isActive ? '#222836' : 'transparent'
})}>🚗 Recepción de vehículo</NavLink>
{/* Próximos: Vehículos, Reservas, Transferencias, CC Reservas */}
</nav>
</aside>
)
}