import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

type Props = {
  initial?: { name?: string; description?: string }
  onSubmit: (payload: { name: string; description?: string }) => Promise<void>
  submitting?: boolean
  isEdit?: boolean
}

export default function RoleForm({ initial = {}, onSubmit, submitting, isEdit }: Props) {
  const [name, setName] = useState(initial.name ?? '')
  const [description, setDescription] = useState(initial.description ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ name, description })
  }

  return (
    <form onSubmit={handleSubmit} className="vstack" style={{ gap: 16 }}>
      <Input label="Nombre" value={name} onChange={e => setName(e.currentTarget.value)} required />
      <Input label="Descripción" value={description} onChange={e => setDescription(e.currentTarget.value)} />
      <div className="hstack" style={{ justifyContent: 'flex-end' }}>
        <Button type="submit" loading={!!submitting}>
          {submitting ? 'Guardando…' : isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}
