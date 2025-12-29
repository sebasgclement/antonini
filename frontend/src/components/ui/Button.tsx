import type { ButtonHTMLAttributes } from 'react'


type Props = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }


export default function Button({ loading, children, ...rest }: Props) {
return (
<button
{...rest}
disabled={loading || rest.disabled}

>
{loading ? 'Procesando…' : children}
</button>
)
}