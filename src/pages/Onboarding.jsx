import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Code2, Map, Target } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { SEO } from '../components/seo/SEO'

const slides = [
  {
    icon: Map,
    title: 'Roadmaps Inteligentes',
    description: 'Siga jornadas de aprendizado organizadas por especialistas. Do front-end ao back-end, cada roadmap te guia passo a passo.',
    color: 'text-brand-400',
  },
  {
    icon: Target,
    title: 'Aprenda na Prática',
    description: 'Labs interativos, quizzes e projetos reais. Teoria e prática lado a lado para você dominar cada tecnologia.',
    color: 'text-sky-400',
  },
  {
    icon: Code2,
    title: 'Sua Carreira Tech',
    description: 'Certificados, progresso gamificado e um plano claro para transformar você em um desenvolvedor completo.',
    color: 'text-violet-400',
  },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const slide = slides[step]
  const isLast = step === slides.length - 1

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('webstart_onboarding_done', 'true')
      navigate('/login')
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('webstart_onboarding_done', 'true')
    navigate('/login')
  }

  return (
    <>
    <SEO title="Boas-Vindas" description="Primeiros passos na WebStart Academy - descubra roadmaps, laboratório de código e tutor IA." url="/onboarding" />
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 p-4">
      <div className="brutal-card w-full max-w-md rounded-2xl p-8 text-center">
        {/* Dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-brand-500' : 'w-2 bg-brand-700'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-3 border-brand-700 bg-brand-950">
          <slide.icon size={48} className={slide.color} />
        </div>

        {/* Content */}
        <h2 className="mb-3 text-2xl font-black text-primary">{slide.title}</h2>
        <p className="mx-auto mb-8 max-w-sm text-secondary">{slide.description}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleNext} className="w-full">
            {isLast ? (
              <>
                Começar Agora <Check size={18} className="ml-1" />
              </>
            ) : (
              <>
                Próximo <ArrowRight size={18} className="ml-1" />
              </>
            )}
          </Button>
          <button
            onClick={handleSkip}
            className="text-sm font-bold text-muted hover:text-secondary hover:underline"
          >
            Pular introdução
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
