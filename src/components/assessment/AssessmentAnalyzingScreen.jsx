import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2, Sparkles } from 'lucide-react'

const ANALYSIS_STEPS = [
  'Analisando seu perfil de aprendizagem...',
  'Cruzando seus interesses com as trilhas disponíveis...',
  'Avaliando sua disponibilidade e ritmo ideal...',
  'Consultando a IA mentora da WebStart...',
  'Montando seu plano personalizado...',
]

export function AssessmentAnalyzingScreen({ isBackendDone, onFinish }) {
  const [completedSteps, setCompletedSteps] = useState([])
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setCompletedSteps((prev) => {
        if (prev.length < ANALYSIS_STEPS.length) {
          return [...prev, prev.length]
        }
        return prev
      })
    }, 750)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const checkFinish = setInterval(() => {
      const elapsed = Date.now() - startTime
      const minDurationMet = elapsed >= 4200
      const maxTimeoutMet = elapsed >= 6000

      if ((minDurationMet && isBackendDone) || maxTimeoutMet) {
        clearInterval(checkFinish)
        onFinish()
      }
    }, 200)
    return () => clearInterval(checkFinish)
  }, [startTime, isBackendDone, onFinish])

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 overflow-hidden">
      {/* Background glow — same as intro */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-accent/10 rounded-full blur-[140px] animate-pulse pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="brutal-card relative z-10 max-w-lg w-full rounded-2xl p-8 sm:p-10"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-accent-soft border border-strong text-accent">
            <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h2 className="text-xl font-black text-primary">Criando seu plano...</h2>
            <p className="text-xs text-muted font-medium">Aguarde enquanto organizamos tudo para você.</p>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {ANALYSIS_STEPS.map((text, idx) => {
            const isDone = completedSteps.includes(idx)
            const isCurrent = completedSteps.length === idx

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.15 }}
                className="flex items-center gap-3.5 text-sm"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    isDone
                      ? 'bg-accent text-white border-2 border-accent'
                      : isCurrent
                      ? 'bg-elevated border-2 border-accent text-accent'
                      : 'bg-elevated border-2 border-strong text-muted'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-mono">{idx + 1}</span>
                  )}
                </div>

                <span
                  className={`transition-colors duration-300 font-semibold ${
                    isDone
                      ? 'text-primary'
                      : isCurrent
                      ? 'text-accent'
                      : 'text-muted'
                  }`}
                >
                  {text}
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
