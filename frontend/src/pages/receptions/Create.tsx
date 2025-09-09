import { useState, type FormEvent } from 'react'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Toast from '../../components/ui/Toast'

export default function ReceptionCreate() {
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  // ---------- Cliente ----------
  const [customerId, setCustomerId] = useState<number | ''>('') 
  const [customerName, setCustomerName] = useState('')           
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // ---------- Vehículo ----------
  const [brand, setBrand] = useState('')   
  const [model, setModel] = useState('')   
  const [year, setYear] = useState<number | ''>('')
  const [plate, setPlate] = useState('')
  const [vin, setVin] = useState('')
  const [color, setColor] = useState('')
  const [km, setKm] = useState<number | ''>('')
  const [fuelLevel, setFuelLevel] = useState<number | ''>('') 

  // ---------- Checklist ----------
  const [hasSpare, setHasSpare] = useState(true)
  const [hasJack, setHasJack] = useState(true)
  const [hasDocs, setHasDocs] = useState(true)
  const [notes, setNotes] = useState('')

  // Validación mínima en front para el contrato
  const validate = () => {
    if (!brand.trim()) return 'La marca es obligatoria'
    if (!model.trim()) return 'El modelo es obligatorio'
    if (fuelLevel !== '' && (fuelLevel < 0 || fuelLevel > 100)) return 'Combustible debe estar entre 0 y 100'
    return ''
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = validate()
    if (v) { setToast(v); return }

    setLoading(true)
    setToast('')

    try {
      const payload = {
        customer: {
          id: customerId === '' ? undefined : customerId,
          name: customerName || undefined,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
        },
        vehicle: {
          brand,
          model,
          year: year === '' ? undefined : year,
          plate: plate || undefined,
          vin: vin || undefined,
          color: color || undefined,
          km: km === '' ? undefined : km,
          fuel_level: fuelLevel === '' ? undefined : fuelLevel,
        },
        checklist: {
          spare: hasSpare,
          jack: hasJack,
          docs: hasDocs,
        },
        notes: notes || undefined,
      }

      await api.post('/api/receptions', payload)
      setToast('Recepción registrada ✅')

      // limpiar
      setCustomerId(''); setCustomerName(''); setCustomerEmail(''); setCustomerPhone('')
      setBrand(''); setModel(''); setYear(''); setPlate(''); setVin(''); setColor(''); setKm(''); setFuelLevel('')
      setHasSpare(true); setHasJack(true); setHasDocs(true); setNotes('')
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'No se pudo registrar la recepción')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="title">Recepción de vehículo — Alta</div>

      <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
        {/* ---- Cliente ---- */}
        <section className="card vstack">
          <div className="title">Datos del cliente</div>
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="Cliente ID" type="number" value={customerId as any}
                   onChange={e => setCustomerId(parseInt(e.currentTarget.value) || '')}
                   placeholder="Si ya existe en la base" />
            <Input label="Nombre y apellido" value={customerName}
                   onChange={e => setCustomerName(e.currentTarget.value)} />
          </div>
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="Email" type="email" value={customerEmail}
                   onChange={e => setCustomerEmail(e.currentTarget.value)} />
            <Input label="Teléfono" value={customerPhone}
                   onChange={e => setCustomerPhone(e.currentTarget.value)} />
          </div>
        </section>

        {/* ---- Vehículo ---- */}
        <section className="card vstack">
          <div className="title">Datos del vehículo</div>
          <div className="hstack" style={{ gap: 16, flexWrap: 'wrap' }}>
            <Input label="Marca *" value={brand} onChange={e => setBrand(e.currentTarget.value)} required />
            <Input label="Modelo *" value={model} onChange={e => setModel(e.currentTarget.value)} required />
            <Input label="Año" type="number" value={year as any}
                   onChange={e => setYear(parseInt(e.currentTarget.value) || '')} />
            <Input label="Patente" value={plate} onChange={e => setPlate(e.currentTarget.value)} />
            <Input label="VIN / Chasis" value={vin} onChange={e => setVin(e.currentTarget.value)} />
            <Input label="Color" value={color} onChange={e => setColor(e.currentTarget.value)} />
            <Input label="Kilometraje" type="number" value={km as any}
                   onChange={e => setKm(parseInt(e.currentTarget.value) || '')} />
            <Input label="Combustible (%)" type="number" value={fuelLevel as any}
                   onChange={e => setFuelLevel(parseInt(e.currentTarget.value) || '')} />
          </div>
        </section>

        {/* ---- Checklist ---- */}
        <section className="card vstack">
          <div className="title">Checklist</div>
          <div className="hstack" style={{ gap: 16, flexWrap: 'wrap' }}>
            <label className="label">
              <input type="checkbox" checked={hasSpare} onChange={e => setHasSpare(e.currentTarget.checked)} /> Rueda de auxilio
            </label>
            <label className="label">
              <input type="checkbox" checked={hasJack} onChange={e => setHasJack(e.currentTarget.checked)} /> Cric / Herramientas
            </label>
            <label className="label">
              <input type="checkbox" checked={hasDocs} onChange={e => setHasDocs(e.currentTarget.checked)} /> Documentación
            </label>
          </div>

          <div className="vstack">
            <label className="label">Observaciones</label>
            <textarea
              style={{
                background: '#0c0f14',
                color: 'var(--color-text)',
                border: '1px solid #252b37',
                borderRadius: 10,
                padding: '10px 12px',
                minHeight: 100,
              }}
              value={notes}
              onChange={e => setNotes(e.currentTarget.value)}
            />
          </div>
        </section>

        <div className="hstack" style={{ justifyContent: 'flex-end' }}>
          <Button type="submit" loading={loading}>Guardar recepción</Button>
        </div>
      </form>

      {toast && <Toast message={toast} type={toast.includes('✅') ? 'success' : 'error'} />}
    </div>
  )
}
