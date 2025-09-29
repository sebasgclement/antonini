// src/pages/vehicles/Register.tsx
import { useState, type FormEvent } from 'react'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Toast from '../../components/ui/Toast'

export default function RegisterVehicle() {
  const [plate, setPlate] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState<number | ''>('')
  const [vin, setVin] = useState('')
  const [color, setColor] = useState('')
  const [km, setKm] = useState<number | ''>('')
  const [fuelLevel, setFuelLevel] = useState<number | ''>('')

  const [ownership, setOwnership] = useState<'propio' | 'consignado'>('consignado')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const [checkSpare, setCheckSpare] = useState(true)
  const [checkJack, setCheckJack] = useState(true)
  const [checkDocs, setCheckDocs] = useState(true)
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setToast('')

    try {
      const payload: any = {
        plate,
        brand,
        model,
        year: year === '' ? undefined : year,
        vin: vin || undefined,
        color: color || undefined,
        km: km === '' ? undefined : km,
        fuel_level: fuelLevel === '' ? undefined : fuelLevel,
        ownership,
        check_spare: checkSpare,
        check_jack: checkJack,
        check_docs: checkDocs,
        notes: notes || undefined,
      }

      // cliente solo si es consignado
      if (ownership === 'consignado') {
        payload.customer_id = customerId === '' ? undefined : customerId
        if (!payload.customer_id) {
          payload.customer = {
            name: customerName || undefined,
            email: customerEmail || undefined,
            phone: customerPhone || undefined,
          }
        }
      }

      await api.post('/vehicles', payload)
      setToast('Vehículo registrado con éxito ✅')

      // limpiar
      setPlate(''); setBrand(''); setModel(''); setYear('')
      setVin(''); setColor(''); setKm(''); setFuelLevel('')
      setOwnership('consignado')
      setCustomerId(''); setCustomerName(''); setCustomerEmail(''); setCustomerPhone('')
      setCheckSpare(true); setCheckJack(true); setCheckDocs(true); setNotes('')
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'No se pudo registrar el vehículo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
        <div className="title">Registro de vehículos</div>

        {/* Datos vehículo */}
        <div className="card vstack" style={{ gap: 16 }}>
          <Input label="Patente *" value={plate} onChange={e => setPlate(e.currentTarget.value)} required />
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="Marca *" value={brand} onChange={e => setBrand(e.currentTarget.value)} required />
            <Input label="Modelo *" value={model} onChange={e => setModel(e.currentTarget.value)} required />
            <Input label="Año" type="number" value={year as any} onChange={e => setYear(parseInt(e.currentTarget.value) || '')} />
          </div>
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="VIN / Chasis" value={vin} onChange={e => setVin(e.currentTarget.value)} />
            <Input label="Color" value={color} onChange={e => setColor(e.currentTarget.value)} />
            <Input label="Kilometraje" type="number" value={km as any} onChange={e => setKm(parseInt(e.currentTarget.value) || '')} />
            <Input label="Combustible (%)" type="number" value={fuelLevel as any} onChange={e => setFuelLevel(parseInt(e.currentTarget.value) || '')} />
          </div>
        </div>

        {/* Propiedad */}
        <div className="card vstack">
          <div className="hstack" style={{ gap: 16 }}>
            <label>
              <input type="radio" name="ownership" value="propio"
                checked={ownership === 'propio'} onChange={() => setOwnership('propio')} />
              Propio
            </label>
            <label>
              <input type="radio" name="ownership" value="consignado"
                checked={ownership === 'consignado'} onChange={() => setOwnership('consignado')} />
              Consignado
            </label>
          </div>
        </div>

        {/* Datos cliente, solo si consignado */}
        {ownership === 'consignado' && (
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title">Datos del cliente</div>
            <Input label="ID Cliente existente" type="number" value={customerId as any}
              onChange={e => setCustomerId(parseInt(e.currentTarget.value) || '')} />
            <Input label="Nombre completo" value={customerName} onChange={e => setCustomerName(e.currentTarget.value)} />
            <Input label="Email" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.currentTarget.value)} />
            <Input label="Teléfono" value={customerPhone} onChange={e => setCustomerPhone(e.currentTarget.value)} />
          </div>
        )}

        {/* Checklist */}
        <div className="card vstack" style={{ gap: 8 }}>
          <div className="title">Checklist</div>
          <label><input type="checkbox" checked={checkSpare} onChange={e => setCheckSpare(e.currentTarget.checked)} /> Rueda de auxilio</label>
          <label><input type="checkbox" checked={checkJack} onChange={e => setCheckJack(e.currentTarget.checked)} /> Cric / Herramientas</label>
          <label><input type="checkbox" checked={checkDocs} onChange={e => setCheckDocs(e.currentTarget.checked)} /> Documentación</label>
          <textarea
            placeholder="Observaciones"
            value={notes}
            onChange={e => setNotes(e.currentTarget.value)}
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
          <Button type="submit" loading={loading}>Guardar</Button>
        </div>
      </form>

      {toast && <Toast message={toast} type={toast.includes('éxito') ? 'success' : 'error'} />}
    </div>
  )
}
