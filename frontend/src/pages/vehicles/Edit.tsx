import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Toast from '../../components/ui/Toast'

type Vehicle = {
  id: number
  plate: string
  brand: string
  model: string
  year?: number
  vin?: string
  color?: string
  km?: number
  fuel_level?: number
  ownership: 'propio' | 'consignado'
  customer_id?: number | null
  check_spare: boolean
  check_jack: boolean
  check_docs: boolean
  notes?: string
}

export default function VehicleEdit() {
  const { id } = useParams()
  const nav = useNavigate()

  const [v, setV] = useState<Partial<Vehicle>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/vehicles/${id}`)
        setV(data?.data ?? data ?? {})
      } catch (err: any) {
        setToast(err?.response?.data?.message || 'No se pudo cargar el vehículo')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        vin: v.vin,
        color: v.color,
        km: v.km,
        fuel_level: v.fuel_level,
        ownership: v.ownership,
        customer_id: v.ownership === 'consignado' ? v.customer_id : undefined,
        check_spare: v.check_spare,
        check_jack: v.check_jack,
        check_docs: v.check_docs,
        notes: v.notes,
      }

      await api.put(`/vehicles/${id}`, payload)
      setToast('Vehículo actualizado ✅')
      nav('/vehiculos')
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'No se pudo actualizar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container">Cargando…</div>

  return (
    <div className="container">
      <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
        <div className="title">Editar vehículo #{id}</div>

        {/* Datos vehículo */}
        <div className="card vstack" style={{ gap: 16 }}>
          <Input label="Patente *" value={v.plate || ''} onChange={e => setV({ ...v, plate: e.currentTarget.value })} required />
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="Marca *" value={v.brand || ''} onChange={e => setV({ ...v, brand: e.currentTarget.value })} required />
            <Input label="Modelo *" value={v.model || ''} onChange={e => setV({ ...v, model: e.currentTarget.value })} required />
            <Input label="Año" type="number" value={v.year || ''} onChange={e => setV({ ...v, year: parseInt(e.currentTarget.value) || undefined })} />
          </div>
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="VIN / Chasis" value={v.vin || ''} onChange={e => setV({ ...v, vin: e.currentTarget.value })} />
            <Input label="Color" value={v.color || ''} onChange={e => setV({ ...v, color: e.currentTarget.value })} />
            <Input label="Kilometraje" type="number" value={v.km || ''} onChange={e => setV({ ...v, km: parseInt(e.currentTarget.value) || undefined })} />
            <Input label="Combustible (%)" type="number" value={v.fuel_level || ''} onChange={e => setV({ ...v, fuel_level: parseInt(e.currentTarget.value) || undefined })} />
          </div>
        </div>

        {/* Propiedad */}
        <div className="card vstack">
          <div className="hstack" style={{ gap: 16 }}>
            <label>
              <input type="radio" name="ownership" value="propio"
                checked={v.ownership === 'propio'} onChange={() => setV({ ...v, ownership: 'propio', customer_id: undefined })} />
              Propio
            </label>
            <label>
              <input type="radio" name="ownership" value="consignado"
                checked={v.ownership === 'consignado'} onChange={() => setV({ ...v, ownership: 'consignado' })} />
              Consignado
            </label>
          </div>
        </div>

        {/* Datos cliente si consignado */}
        {v.ownership === 'consignado' && (
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title">Datos del cliente</div>
            <Input label="ID Cliente existente" type="number" value={v.customer_id || ''} onChange={e => setV({ ...v, customer_id: parseInt(e.currentTarget.value) || undefined })} />
          </div>
        )}

        {/* Checklist */}
        <div className="card vstack" style={{ gap: 8 }}>
          <div className="title">Checklist</div>
          <label><input type="checkbox" checked={v.check_spare || false} onChange={e => setV({ ...v, check_spare: e.currentTarget.checked })} /> Rueda de auxilio</label>
          <label><input type="checkbox" checked={v.check_jack || false} onChange={e => setV({ ...v, check_jack: e.currentTarget.checked })} /> Cric / Herramientas</label>
          <label><input type="checkbox" checked={v.check_docs || false} onChange={e => setV({ ...v, check_docs: e.currentTarget.checked })} /> Documentación</label>
          <textarea
            placeholder="Observaciones"
            value={v.notes || ''}
            onChange={e => setV({ ...v, notes: e.currentTarget.value })}
            style={{
              background: '#0c0f14',
              color: 'var(--color-text)',
              border: '1px solid #252b37',
              borderRadius: 10,
              padding: '10px 12px',
              minHeight: 80,
            }}
          />
        </div>

        <div className="hstack" style={{ justifyContent: 'flex-end' }}>
          <Button type="submit" loading={saving}>Guardar cambios</Button>
        </div>
      </form>

      {toast && <Toast message={toast} type={toast.includes('✅') ? 'success' : 'error'} />}
    </div>
  )
}
