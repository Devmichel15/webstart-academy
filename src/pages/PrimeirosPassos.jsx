import { useNavigate } from 'react-router-dom'
import { ArrowRight, Cpu, BookOpen, Zap } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { SEO } from '../components/seo/SEO'
import { useAuthContext } from '../contexts/AuthContext.jsx'
import { updateUserProfile } from '../services/userService.js'

export default function PrimeirosPassos() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const handleStart = async () => {
    if (user) {
      await updateUserProfile(user.uid, { firstStepsDone: true })
    }
    navigate('/video-aula/logica-vid-1', { replace: true })
  }

  const handleSkip = async () => {
    if (user) {
      await updateUserProfile(user.uid, { firstStepsDone: true })
    }
    navigate('/', { replace: true })
  }

  return (
    <>
    <SEO
      title="Primeiros Passos"
      description="Inicia a tua jornada de programação com Lógica de Programação na WebStart Academy."
      url="/primeiros-passos"
    />
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 p-4">
      <div className="brutal-card w-full max-w-lg rounded-2xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-3 border-indigo-700 bg-indigo-950">
          <Cpu size={40} className="text-indigo-400" />
        </div>

        <h2 className="mb-2 text-2xl font-black text-primary">
          Bem-vindo à WebStart!
        </h2>
        <p className="mb-8 text-secondary">
          Antes de escrever código, vais aprender a pensar como um programador. Tudo começa pela lógica!
        </p>

        <Card className="mb-8 text-left">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-strong bg-indigo-600 text-white">
              <Cpu size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black">Lógica de Programação</h3>
              <p className="mb-3 text-sm text-secondary">
                Algoritmos, variáveis, condicionais, laços e vetores com o Prof. Gustavo Guanabara.
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-secondary">
                  <BookOpen size={14} /> 15 aulas
                </span>
                <span className="flex items-center gap-1 text-secondary">
                  <Zap size={14} /> ~6 horas
                </span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">
                  Iniciante
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Button onClick={handleStart} className="w-full">
            Começar agora
            <ArrowRight size={18} className="ml-1" />
          </Button>
          <button
            onClick={handleSkip}
            className="text-sm font-bold text-muted hover:text-secondary hover:underline"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
