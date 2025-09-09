import { useEffect, useState } from 'react'


export default function Toast({ message, type = 'info' }: { message: string, type?: 'info'|'error'|'success' }) {
const [open, setOpen] = useState(!!message)
useEffect(() => { setOpen(!!message) }, [message])
if (!open) return null
const bg = type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)'
return (
<div style={{
position: 'fixed', bottom: 20, right: 20,
background: bg, color: '#0b0e14', padding: '10px 12px',
borderRadius: 10, fontWeight: 700
}} onClick={() => setOpen(false)}>
{message}
</div>
)
}