import { useState } from 'react'
import type { FormEvent } from 'react'

import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Toast from '../../components/ui/Toast'

export default function RegisterCustomer() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [docType, setDocType] = useState('DNI')
  const [docNumber, setDocNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setToast('')
    try {
      const { data } = await api.post('/api/customers/register', {
        first_name: firstName,
        last_name: lastName,
        doc_type: docType,
        doc_number: docNumber,
        email,
        phone,
      })
      setToast('Cliente registrado con éxito')
      // limpiar formulario (opcional)
      setFirstName('')
      setLastName('')
      setDocType('DNI')
      setDocNumber('')
      setEmail('')
      setPhone('')
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'No se pudo registrar el cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card vstack" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="title">Registro de clientes</div>
        <form onSubmit={onSubmit} className="vstack">
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="Nombre" value={firstName} onChange={e => setFirstName(e.currentTarget.value)} required />
            <Input label="Apellido" value={lastName} onChange={e => setLastName(e.currentTarget.value)} required />
          </div>
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="Tipo doc" value={docType} onChange={e => setDocType(e.currentTarget.value)} placeholder="DNI / Pasaporte" />
            <Input label="Nro doc" value={docNumber} onChange={e => setDocNumber(e.currentTarget.value)} />
          </div>
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.currentTarget.value)} />
            <Input label="Teléfono" value={phone} onChange={e => setPhone(e.currentTarget.value)} />
          </div>

          <div className="hstack" style={{ justifyContent: 'flex-end' }}>
            <Button type="submit" loading={loading}>Guardar</Button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast} type={toast.includes('éxito') ? 'success' : 'error'} />}
    </div>
  )
}
