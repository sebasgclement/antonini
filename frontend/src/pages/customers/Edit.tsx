import { useEffect, useState, type FormEvent } from 'react'
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

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/customers/${id}`)
        // Soporta { ok:true, data:{...} } o plano
        setC(data?.data ?? data ?? {})
      } catch (e: any) {
        setToast(e?.response?.data?.message || 'No se pudo cargar el cliente')
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
        first_name: c.first_name ?? undefined,
        last_name:  c.last_name ?? undefined,
        doc_type:   c.doc_type ?? undefined,
        doc_number: c.doc_number ?? undefined,
        email:      c.email ?? undefined,
        phone:      c.phone ?? undefined,
      }
      await api.put(`/api/customers/${id}`, payload)
      setToast('Cliente actualizado')
      nav('/clientes')
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
          <Input label="Tipo doc" value={c.doc_type || ''} onChange={e => setC({ ...c, doc_type: e.currentTarget.value })} />
          <Input label="Nro doc" value={c.doc_number || ''} onChange={e => setC({ ...c, doc_number: e.currentTarget.value })} />
        </div>
        <div className="hstack" style={{ gap: 16 }}>
          <Input label="Email" type="email" value={c.email || ''} onChange={e => setC({ ...c, email: e.currentTarget.value })} />
          <Input label="Teléfono" value={c.phone || ''} onChange={e => setC({ ...c, phone: e.currentTarget.value })} />
        </div>
        <div className="hstack" style={{ justifyContent: 'flex-end' }}>
          <Button type="submit" loading={saving}>Guardar cambios</Button>
        </div>
      </form>

      {toast && <Toast message={toast} type={toast.includes('actualizado') ? 'success' : 'error'} />}
    </div>
  )
}
