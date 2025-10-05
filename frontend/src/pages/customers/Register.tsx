import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
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
  const [dniFront, setDniFront] = useState<File | null>(null)
  const [dniBack, setDniBack] = useState<File | null>(null)
  const [previewFront, setPreviewFront] = useState<string | null>(null)
  const [previewBack, setPreviewBack] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0] || null
    if (!file) return
    const url = URL.createObjectURL(file)
    if (side === 'front') {
      setDniFront(file)
      setPreviewFront(url)
    } else {
      setDniBack(file)
      setPreviewBack(url)
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setToast('')

    try {
      const form = new FormData()
      form.append('first_name', firstName)
      form.append('last_name', lastName)
      form.append('doc_type', docType)
      form.append('doc_number', docNumber)
      if (email) form.append('email', email)
      if (phone) form.append('phone', phone)
      if (dniFront) form.append('dni_front', dniFront)
      if (dniBack) form.append('dni_back', dniBack)

      await api.post('/customers', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setToast('Cliente registrado con éxito ✅')
      setFirstName('')
      setLastName('')
      setDocType('DNI')
      setDocNumber('')
      setEmail('')
      setPhone('')
      setDniFront(null)
      setDniBack(null)
      setPreviewFront(null)
      setPreviewBack(null)
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'No se pudo registrar el cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card vstack" style={{ maxWidth: 700, margin: '0 auto', gap: 16 }}>
        <div className="title">Registro de clientes</div>
        <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
          <div className="hstack" style={{ gap: 16 }}>
            <Input label="Nombre" value={firstName} onChange={e => setFirstName(e.currentTarget.value)} required />
            <Input label="Apellido" value={lastName} onChange={e => setLastName(e.currentTarget.value)} required />
          </div>

          <div className="hstack" style={{ gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tipo de documento</label>
              <select
                value={docType}
                onChange={e => setDocType(e.currentTarget.value)}
                style={{
                  background: '#0c0f14',
                  color: 'var(--color-text)',
                  border: '1px solid #252b37',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <option value="DNI">DNI</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <Input label="Número" value={docNumber} onChange={e => setDocNumber(e.currentTarget.value)} required />
          </div>

          <div className="hstack" style={{ gap: 16 }}>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.currentTarget.value)} />
            <Input label="Teléfono" value={phone} onChange={e => setPhone(e.currentTarget.value)} />
          </div>

          {/* === Subida de fotos de DNI === */}
          <div className="card vstack" style={{ gap: 12 }}>
            <label>Fotos del DNI (opcional)</label>
            <div className="hstack" style={{ gap: 16, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Frente</label>
                <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'front')} />
                {previewFront && (
                  <img
                    src={previewFront}
                    alt="DNI Frente"
                    style={{ width: '100%', maxWidth: 280, marginTop: 8, borderRadius: 8 }}
                  />
                )}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Dorso</label>
                <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'back')} />
                {previewBack && (
                  <img
                    src={previewBack}
                    alt="DNI Dorso"
                    style={{ width: '100%', maxWidth: 280, marginTop: 8, borderRadius: 8 }}
                  />
                )}
              </div>
            </div>
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
