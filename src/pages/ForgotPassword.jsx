import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout.jsx'
import { Button } from '../components/ui/Button.jsx'
import { resetPassword } from '../services/authService.js'
import { useToast } from '../contexts/ToastContext.jsx'
import { SEO } from '../components/seo/SEO'

export default function ForgotPassword() {
  const { showError, showSuccess } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      await resetPassword(email)
      setSent(true)
      showSuccess('Email de recuperação enviado!')
    } catch (error) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <SEO title="Recuperar Senha" description="Recupere o acesso à sua conta WebStart Academy." url="/recuperar-senha" />
    <AuthLayout title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha.">
      {sent ? (
        <div className="text-center">
          <p className="mb-4 text-sm text-brand-700 dark:text-brand-300">
            Verifique sua caixa de entrada em <strong>{email}</strong>.
          </p>
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            Voltar ao login
          </Link>
        </div>
      ) : (
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Enviar link'}
          </Button>

          <p className="text-center text-sm">
            <Link to="/login" className="font-bold text-brand-600 hover:underline">
              Voltar ao login
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
    </>
  )
}
