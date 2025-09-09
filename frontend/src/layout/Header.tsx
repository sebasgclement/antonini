import useAuth from '../hooks/useAuth'
import Button from '../components/ui/Button'


export default function Header() {
const { user, logout } = useAuth()
return (
<header className="hstack" style={{
justifyContent: 'space-between', padding: '12px 16px',
borderBottom: '1px solid #1f2430', background: 'var(--color-card)', borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)'
}}>
<div className="title">{(window as any).__APP_NAME__ || 'Antonini'}</div>
<div className="hstack" style={{ gap: 12 }}>
<span style={{ color: 'var(--color-muted)' }}>{user?.name || user?.email}</span>
<Button onClick={logout}>Salir</Button>
</div>
</header>
)
}