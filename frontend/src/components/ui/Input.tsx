import type { InputHTMLAttributes } from 'react'


type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string }


export default function Input({ label, ...rest }: Props) {
return (
<div className="vstack">
{label && <label className="label">{label}</label>}
<input
{...rest}

/>
</div>
)
}