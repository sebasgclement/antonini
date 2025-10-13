import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Toast from '../../components/ui/Toast'

type Vehicle = {
  id: number
  plate: string
  brand: string
  model: string
  status: string
  price?: number
}

export default function RegisterReservation() {
  const nav = useNavigate()
  const [params] = useSearchParams()

  const vehicleIdParam = params.get('vehicle_id')
  const customerIdParam = params.get('customer_id')

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [vehicleId, setVehicleId] = useState<number | ''>(
    vehicleIdParam ? parseInt(vehicleIdParam) : ''
  )
  const [customerId, setCustomerId] = useState<number | ''>(
    customerIdParam ? parseInt(customerIdParam) : ''
  )

  const [price, setPrice] = useState<number | ''>('') // 💲 precio vehículo principal
  const [deposit, setDeposit] = useState<number | ''>('') // 💰 seña
  const [paymentMethod, setPaymentMethod] = useState('')
  const [comments, setComments] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔹 Parte de pago / vehículo usado
  const [hasTradeIn, setHasTradeIn] = useState(false)
  const [tradeInVehicleId, setTradeInVehicleId] = useState<number | ''>('')
  const [tradeInValue, setTradeInValue] = useState<number | ''>('') // 💵 valor del usado

  // 🧮 Saldo restante
  const [balance, setBalance] = useState<number>(0)

  // 🔹 Cargar datos base
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/reservations/create')
        setVehicles(data.vehicles || [])
        setCustomers(data.customers || [])

        // Si venimos redirigidos con un vehículo, precargar precio
        if (vehicleIdParam) {
          const v = data.vehicles?.find((x: Vehicle) => x.id === parseInt(vehicleIdParam))
          if (v?.price) setPrice(v.price)
        }
      } catch {
        setToast('Error al cargar datos')
      }
    })()
  }, [])

  // 🔹 Cuando cambia el vehículo principal → actualizar precio
  useEffect(() => {
    if (!vehicleId) return
    const selected = vehicles.find(v => v.id === vehicleId)
    if (selected && selected.price) setPrice(selected.price)
  }, [vehicleId, vehicles])

  // 🔹 Cuando cambia el vehículo entregado → autocompletar valor
  useEffect(() => {
    if (!tradeInVehicleId) {
      setTradeInValue('')
      return
    }
    const trade = vehicles.find(v => v.id === tradeInVehicleId)
    if (trade && trade.price) {
      setTradeInValue(trade.price)
    } else {
      setTradeInValue('')
    }
  }, [tradeInVehicleId, vehicles])

  // 🔹 Reaccionar a cambios en parámetros de URL
  useEffect(() => {
    if (vehicleIdParam) setVehicleId(parseInt(vehicleIdParam))
    if (customerIdParam) setCustomerId(parseInt(customerIdParam))
  }, [vehicleIdParam, customerIdParam])

  // 🧮 Calcular saldo restante dinámicamente
  useEffect(() => {
    const total = Number(price) || 0
    const paid = Number(deposit) || 0
    const tradeValue = hasTradeIn ? Number(tradeInValue) || 0 : 0
    setBalance(total - paid - tradeValue)
  }, [price, deposit, tradeInValue, hasTradeIn])

  // 🔹 Guardar reserva
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/reservations', {
        vehicle_id: vehicleId,
        customer_id: customerId,
        seller_id: 1, // ⚠️ reemplazar con ID real del usuario logueado
        price,
        deposit,
        payment_method: paymentMethod,
        used_vehicle_id: hasTradeIn ? tradeInVehicleId : null,
        trade_in_value: hasTradeIn ? tradeInValue : null,
        balance,
        comments,
      })
      setToast('Reserva creada correctamente ✅')
      setTimeout(() => nav('/reservas'), 800)
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'No se pudo registrar la reserva')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
        <div className="title">Registrar reserva</div>

        {/* VEHÍCULO PRINCIPAL */}
        <div className="card vstack" style={{ gap: 16 }}>
          <label>Vehículo *</label>
          <a href="/vehiculos/registro?redirect=/reservas/nueva" className="enlace">
            + Registrar vehículo
          </a>

          <select
            value={vehicleId}
            onChange={e => setVehicleId(parseInt(e.currentTarget.value) || '')}
            required
          >
            <option value="">Seleccionar…</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} ({v.plate})
              </option>
            ))}
          </select>
        </div>

        {/* CLIENTE */}
        <div className="card vstack" style={{ gap: 16 }}>
          <label>Cliente *</label>
          <a href="/clientes/registro?redirect=/reservas/nueva" className="enlace">
            + Registrar cliente
          </a>

          <select
            value={customerId}
            onChange={e => setCustomerId(parseInt(e.currentTarget.value) || '')}
            required
          >
            <option value="">Seleccionar…</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* DATOS ECONÓMICOS */}
        <div className="card vstack" style={{ gap: 16 }}>
          <div className="form-row">
            <Input
              label="Precio total ($)"
              type="number"
              value={price as any}
              onChange={e => setPrice(parseFloat(e.currentTarget.value) || '')}
              required
            />
            <Input
              label="Seña / anticipo ($)"
              type="number"
              value={deposit as any}
              onChange={e => setDeposit(parseFloat(e.currentTarget.value) || '')}
            />
          </div>

          <div className="form-group">
            <label>Forma de pago</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.currentTarget.value)}
              required
            >
              <option value="">Seleccionar…</option>
              <option value="efectivo">Efectivo</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta_debito">Tarjeta de Débito</option>
              <option value="tarjeta_credito">Tarjeta de Crédito</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
        </div>

        {/* VEHÍCULO USADO COMO PARTE DE PAGO */}
        <div className="card vstack" style={{ gap: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={hasTradeIn}
              onChange={e => setHasTradeIn(e.currentTarget.checked)}
            />{' '}
            Entrega un vehículo como parte de pago
          </label>

          {hasTradeIn && (
            <div className="vstack" style={{ gap: 12 }}>
              <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Seleccionar vehículo usado</label>
                <a href="/vehiculos/registro?redirect=/reservas/nueva" className="enlace">
                  + Registrar vehículo
                </a>
              </div>

              <select
                value={tradeInVehicleId}
                onChange={e => setTradeInVehicleId(parseInt(e.currentTarget.value) || '')}
                required={hasTradeIn}
              >
                <option value="">Seleccionar…</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.plate}) - ${v.price?.toLocaleString() || '—'}
                  </option>
                ))}
              </select>

              <Input
                label="Valor del vehículo entregado ($)"
                type="number"
                value={tradeInValue as any}
                readOnly
                style={{
                  opacity: 0.8,
                  cursor: 'not-allowed',
                }}
              />
            </div>
          )}
        </div>

        {/* 🧮 SALDO RESTANTE */}
        <div className="card vstack" style={{ gap: 12 }}>
          <label>Saldo restante ($)</label>
          <input
            type="number"
            value={balance}
            readOnly
            style={{
              background: '#0c0f14',
              color: balance >= 0 ? '#4ade80' : '#f87171', // verde si positivo, rojo si negativo
              border: '1px solid #252b37',
              borderRadius: 10,
              padding: '10px 12px',
              fontWeight: 'bold',
            }}
          />
        </div>

        {/* COMENTARIOS */}
        <div className="card vstack" style={{ gap: 12 }}>
          <label>Comentarios</label>
          <textarea
            placeholder="Observaciones adicionales, condiciones de pago, etc."
            value={comments}
            onChange={e => setComments(e.currentTarget.value)}
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
          <Button type="submit" loading={loading}>
            Guardar
          </Button>
        </div>
      </form>

      {toast && (
        <Toast message={toast} type={toast.includes('✅') ? 'success' : 'error'} />
      )}
    </div>
  )
}
