import type { ButtonHTMLAttributes } from 'react'


type Props = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }


export default function Button({ loading, children, ...rest }: Props) {
return (
<button
{...rest}
disabled={loading || rest.disabled}
style={{
background: 'var(--color-primary)',
color: '#0b0e14',
border: '1px solid var(--color-primary-600)',
borderRadius: '10px',
padding: '10px 14px',
fontWeight: 700,
cursor: loading ? 'not-allowed' : 'pointer',
opacity: loading ? 0.7 : 1
}}
>
{loading ? 'Procesando…' : children}
</button>
)
}