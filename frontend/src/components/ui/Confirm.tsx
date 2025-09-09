import type { ReactNode } from 'react'
import Button from './Button'

export default function Confirm({
  open, title, message, onCancel, onConfirm
}: {
  open: boolean
  title: string
  message: ReactNode
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'grid', placeItems: 'center', zIndex: 50
    }}>
      <div className="card vstack" style={{ width: 420, gap: 12 }}>
        <div className="title">{title}</div>
        <div style={{ color: 'var(--color-muted)' }}>{message}</div>
        <div className="hstack" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm}>Confirmar</Button>
        </div>
      </div>
    </div>
  )
}
