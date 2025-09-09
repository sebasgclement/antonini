import Header from './Header'
import Sidebar from './Sidebar'


export default function Layout({ children }: { children: React.ReactNode }) {
return (
<div className="container" style={{ height: '100%' }}>
<div className="vstack" style={{ gap: 12, height: '100%' }}>
<Header />
<div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12, height: '100%' }}>
<Sidebar />
<main className="vstack" style={{ gap: 12 }}>
{children}
</main>
</div>
</div>
</div>
)
}