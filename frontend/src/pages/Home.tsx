import useAuth from '../hooks/useAuth'
import Button from '../components/ui/Button'


export default function Home() {
const { user, logout } = useAuth()
return (
<div className="container vstack">
<header className="hstack" style={{ justifyContent: 'space-between' }}>
<div className="title">Dashboard — {user?.name || 'Usuario'}</div>
<Button onClick={logout}>Salir</Button>
</header>


<section className="card vstack">
<div className="title">Atajos</div>
<div className="hstack" style={{ flexWrap: 'wrap' }}>
<a className="link" href="/clientes/registro">+ Registrar cliente</a>
{/* Agregar: Vehículos, Reservas, Transferencias, etc. */}
</div>
</section>
</div>
)
}