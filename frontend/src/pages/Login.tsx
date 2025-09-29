import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import useAuth from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Toast from '../components/ui/Toast'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@antonini.local')
  const [password, setPassword] = useState('secret123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)  // guarda token + usuario plano en LS
      nav('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="container fullscreen-center">
    <form onSubmit={onSubmit} className="card card-login">
      <div className="vstack">
        <div className="title">Ingresar</div>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.currentTarget.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={e => setPassword(e.currentTarget.value)}
          required
        />
        <Button loading={loading} type="submit">Entrar</Button>
      </div>
    </form>
    {error && <Toast message={error} type="error" />}
  </div>
)

}
