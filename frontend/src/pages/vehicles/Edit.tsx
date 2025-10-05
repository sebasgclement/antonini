import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
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
  photo_front_url?: string | null
  photo_back_url?: string | null
  photo_left_url?: string | null
  photo_right_url?: string | null
}

export default function VehicleEdit() {
  const { id } = useParams()
  const nav = useNavigate()

  const [v, setV] = useState<Partial<Vehicle>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [newPhotos, setNewPhotos] = useState<Record<string, File | null>>({})
  const [preview, setPreview] = useState<Record<string, string | null>>({})

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/vehicles/${id}`)
        const vehicle = data?.data ?? data ?? {}
        setV(vehicle)
        setPreview({
          front: vehicle.photo_front_url || null,
          back: vehicle.photo_back_url || null,
          left: vehicle.photo_left_url || null,
          right: vehicle.photo_right_url || null,
        })
      } catch (err: any) {
        setToast(err?.response?.data?.message || 'No se pudo cargar el vehículo')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, side: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setNewPhotos(prev => ({ ...prev, [side]: file }))
    setPreview(prev => ({ ...prev, [side]: url }))
  }

  const handleRemovePhoto = (side: string) => {
    setNewPhotos(prev => ({ ...prev, [side]: null }))
    setPreview(prev => ({ ...prev, [side]: null }))
    setV(prev => ({ ...prev, [`photo_${side}_url`]: null }))
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const form = new FormData()
      form.append('plate', v.plate || '')
      form.append('brand', v.brand || '')
      form.append('model', v.model || '')
      if (v.year) form.append('year', String(v.year))
      if (v.vin) form.append('vin', v.vin)
      if (v.color) form.append('color', v.color)
      if (v.km) form.append('km', String(v.km))
      if (v.fuel_level) form.append('fuel_level', String(v.fuel_level))
      form.append('ownership', v.ownership || 'propio')
      if (v.ownership === 'consignado' && v.customer_id)
        form.append('customer_id', String(v.customer_id))
      form.append('check_spare', String(v.check_spare || false))
      form.append('check_jack', String(v.check_jack || false))
      form.append('check_docs', String(v.check_docs || false))
      if (v.notes) form.append('notes', v.notes)

      // Adjuntar nuevas fotos
      Object.entries(newPhotos).forEach(([side, file]) => {
        if (file) form.append(`photo_${side}`, file)
        else form.append(`delete_photo_${side}`, '1')
      })

      await api.post(`/vehicles/${id}?_method=PUT`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

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

        {/* Fotos */}
        <div className="card vstack" style={{ gap: 12 }}>
          <div className="title">Fotos del vehículo</div>
          <div className="hstack" style={{ flexWrap: 'wrap', gap: 16 }}>
            {['front', 'back', 'left', 'right'].map(side => (
              <div key={side} className="form-group" style={{ flex: 1, minWidth: 180 }}>
                <label>{{
                  front: 'Frente',
                  back: 'Dorso',
                  left: 'Lateral Izquierdo',
                  right: 'Lateral Derecho',
                }[side]}</label>
                {preview[side] ? (
                  <div style={{ position: 'relative' }}>
                    <img src={preview[side]!} alt={side} style={{ width: '100%', maxWidth: 280, marginTop: 8, borderRadius: 8 }} />
                    <Button
                      type="button"
                      onClick={() => handleRemovePhoto(side)}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                      }}
                    >
                      Quitar
                    </Button>
                  </div>
                ) : (
                  <input type="file" accept="image/*" onChange={e => handleFileChange(e, side)} />
                )}
              </div>
            ))}
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

        {/* Cliente consignado */}
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
