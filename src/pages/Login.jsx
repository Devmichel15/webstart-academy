import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout.jsx'
import { Button } from '../components/ui/Button.jsx'
import { loginWithEmail, loginWithGoogle } from '../services/authService.js'
import { useToast } from '../contexts/ToastContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showError, showSuccess } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const redirectTo = location.state?.from || '/'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      await loginWithEmail(email, password)
      showSuccess('Login realizado com sucesso!')
      navigate(redirectTo, { replace: true })
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
      showSuccess('Login com Google realizado!')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      showError(error.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta WebStart Academy.">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="text-right">
          <Link to="/recuperar-senha" className="text-sm font-bold text-brand-600 hover:underline">
            Esqueceu a senha?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Entrar'}
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
        {googleLoading ? <Loader2 className="animate-spin" size={18} /> : 'Continuar com Google'}
      </Button>

      <p className="mt-6 text-center text-sm">
        Não tem conta?{' '}
        <Link to="/registro" className="font-bold text-brand-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
