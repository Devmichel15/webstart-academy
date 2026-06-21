import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout.jsx'
import { Button } from '../components/ui/Button.jsx'
import { loginWithGoogle, registerWithEmail } from '../services/authService.js'
import { useToast } from '../contexts/ToastContext.jsx'

export default function Register() {
  const navigate = useNavigate()
  const { showError, showSuccess } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      await registerWithEmail({ name, email, password })
      showSuccess('Conta criada com sucesso!')
      navigate('/', { replace: true })
    } catch (error) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)

    try {
      await loginWithGoogle()
      showSuccess('Conta criada com Google!')
      navigate('/', { replace: true })
    } catch (error) {
      showError(error.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Comece sua jornada na WebStart Academy.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-bold">Nome</label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border-3 border-brand-800 bg-white px-3 py-2 text-sm dark:border-brand-400 dark:bg-brand-950"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-bold">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border-3 border-brand-800 bg-white px-3 py-2 text-sm dark:border-brand-400 dark:bg-brand-950"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-bold">Senha</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border-3 border-brand-800 bg-white px-3 py-2 text-sm dark:border-brand-400 dark:bg-brand-950"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Criar conta'}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-brand-200 dark:bg-brand-700" />
        <span className="text-xs font-bold text-brand-600">OU</span>
        <div className="h-px flex-1 bg-brand-200 dark:bg-brand-700" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={googleLoading}
        onClick={handleGoogleLogin}
      >
        {googleLoading ? <Loader2 className="animate-spin" size={18} /> : 'Registrar com Google'}
      </Button>

      <p className="mt-6 text-center text-sm">
        Já tem conta?{' '}
        <Link to="/login" className="font-bold text-brand-600 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
