import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import Toast from '../../components/ui/Toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import type { Customer } from '../../types/customer'

export default function CustomerEdit() {
  const { id } = useParams()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [c, setC] = useState<Partial<Customer>>({})

  const [dniFront, setDniFront] = useState<File | null>(null)
  const [dniBack, setDniBack] = useState<File | null>(null)
  const [previewFront, setPreviewFront] = useState<string | null>(null)
  const [previewBack, setPreviewBack] = useState<string | null>(null)

  const [deleteFront, setDeleteFront] = useState(false)
  const [deleteBack, setDeleteBack] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/customers/${id}`)
        const cliente = data?.data ?? data ?? {}
        setC(cliente)

        // Previews iniciales
        if (cliente.dni_front_url) setPreviewFront(cliente.dni_front_url)
        if (cliente.dni_back_url) setPreviewBack(cliente.dni_back_url)
      } catch (e: any) {
        setToast(e?.response?.data?.message || 'No se pudo cargar el cliente')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0] || null
    if (!file) return
    const url = URL.createObjectURL(file)

    if (side === 'front') {
      setDniFront(file)
      setPreviewFront(url)
      setDeleteFront(false)
    } else {
      setDniBack(file)
      setPreviewBack(url)
      setDeleteBack(false)
    }
  }

  const handleDeleteImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      setDniFront(null)
      setPreviewFront(null)
      setDeleteFront(true)
    } else {
      setDniBack(null)
      setPreviewBack(null)
      setDeleteBack(true)
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    try {
      const form = new FormData()
      form.append('first_name', c.first_name || '')
      form.append('last_name', c.last_name || '')
      form.append('doc_type', c.doc_type || '')
      form.append('doc_number', c.doc_number || '')
      if (c.email) form.append('email', c.email)
      if (c.phone) form.append('phone', c.phone)
      if (dniFront) form.append('dni_front', dniFront)
      if (dniBack) form.append('dni_back', dniBack)

      // Eliminar imágenes existentes si se marcó
      if (deleteFront) form.append('delete_dni_front', '1')
      if (deleteBack) form.append('delete_dni_back', '1')

      await api.post(`/customers/${id}?_method=PUT`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setToast('Cliente actualizado ✅')
      setTimeout(() => nav('/clientes'), 800)
    } catch (e: any) {
      setToast(e?.response?.data?.message || 'No se pudo actualizar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container">Cargando…</div>

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="title">Editar cliente #{id}</div>

      <form onSubmit={onSubmit} className="card vstack" style={{ gap: 16, maxWidth: 800 }}>
        <div className="hstack" style={{ gap: 16 }}>
          <Input label="Nombre" value={c.first_name || ''} onChange={e => setC({ ...c, first_name: e.currentTarget.value })} />
          <Input label="Apellido" value={c.last_name || ''} onChange={e => setC({ ...c, last_name: e.currentTarget.value })} />
        </div>

        <div className="hstack" style={{ gap: 16 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Tipo de documento</label>
            <select
              className="select-doc"
              value={c.doc_type || 'DNI'}
              onChange={e => setC({ ...c, doc_type: e.currentTarget.value })}
            >
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <Input label="Nro doc" value={c.doc_number || ''} onChange={e => setC({ ...c, doc_number: e.currentTarget.value })} />
        </div>

        <div className="hstack" style={{ gap: 16 }}>
          <Input label="Email" type="email" value={c.email || ''} onChange={e => setC({ ...c, email: e.currentTarget.value })} />
          <Input label="Teléfono" value={c.phone || ''} onChange={e => setC({ ...c, phone: e.currentTarget.value })} />
        </div>

        {/* === Fotos de DNI === */}
        <div className="card vstack" style={{ gap: 12 }}>
          <label>Fotos del DNI (opcional)</label>
          <div className="hstack" style={{ gap: 16, flexWrap: 'wrap' }}>
            {/* Frente */}
            <div className="form-group" style={{ flex: 1 }}>
              <label>Frente</label>
              <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'front')} />
              {previewFront && (
                <div style={{ position: 'relative', marginTop: 8 }}>
                  <img
                    src={previewFront}
                    alt="DNI Frente"
                    style={{
                      width: '100%',
                      maxWidth: 280,
                      borderRadius: 8,
                      display: 'block',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage('front')}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(239,68,68,0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Dorso */}
            <div className="form-group" style={{ flex: 1 }}>
              <label>Dorso</label>
              <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'back')} />
              {previewBack && (
                <div style={{ position: 'relative', marginTop: 8 }}>
                  <img
                    src={previewBack}
                    alt="DNI Dorso"
                    style={{
                      width: '100%',
                      maxWidth: 280,
                      borderRadius: 8,
                      display: 'block',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage('back')}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(239,68,68,0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hstack" style={{ justifyContent: 'flex-end' }}>
          <Button type="submit" loading={saving}>Guardar cambios</Button>
        </div>
      </form>

      {toast && <Toast message={toast} type={toast.includes('✅') ? 'success' : 'error'} />}
    </div>
  )
}
