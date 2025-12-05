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
    <form onSubmit={handleSubmit} className="vstack" style={{ gap: 24 }}>
      
      <div className="card vstack" style={{ gap: 16 }}>
        <div className="title" style={{fontSize: '1.1rem', margin: 0}}>
            {isEdit ? 'Editar Detalles del Rol' : 'Definición del Rol'}
        </div>

        <Input 
            label="Nombre del Rol *" 
            value={name} 
            onChange={e => setName(e.currentTarget.value)} 
            required 
            placeholder="Ej: Gerente de Ventas"
        />
        
        <div className="form-group">
            <label>Descripción</label>
            <textarea 
                className="form-control" 
                rows={3}
                value={description} 
                onChange={e => setDescription(e.currentTarget.value)} 
                placeholder="Describe brevemente qué permisos tendrá este rol..."
            />
        </div>

        {/* Pequeña nota de ayuda */}
        <div style={{fontSize: '0.85rem', color: 'var(--color-muted)', background: 'var(--hover-bg)', padding: 12, borderRadius: 8}}>
            💡 <strong>Nota:</strong> Los nombres de roles como "Admin" o "SuperAdmin" suelen tener permisos especiales en el sistema.
        </div>
      </div>

      <div className="hstack" style={{ justifyContent: 'flex-end' }}>
        <Button type="submit" loading={!!submitting} style={{padding: '10px 24px'}}>
          {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Rol'}
        </Button>
      </div>
    </form>
  )
}