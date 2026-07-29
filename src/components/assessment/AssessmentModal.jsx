import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, ArrowRight, Clock } from 'lucide-react'
import { Button } from '../ui/Button.jsx'

export function AssessmentModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(isOpen)

  useEffect(() => {
    setVisible(isOpen)
  }, [isOpen])

  const handleStartNow = () => {
    sessionStorage.setItem('assessment_modal_dismissed', 'true')
    onClose()
    navigate('/avaliacao-perfil')
  }

  const handleDismiss = () => {
    sessionStorage.setItem('assessment_modal_dismissed', 'true')
    onClose()
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="brutal-card relative w-full max-w-lg rounded-2xl p-8 sm:p-10 text-center overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-500/10 rounded-full blur-[90px] pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-muted hover:text-primary hover:bg-surface-hover rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-3 border-border-strong bg-surface shadow-brutal p-3">
            <img src="/logo.svg" alt="WebStart Academy" className="h-full w-full object-contain" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-border-strong bg-surface px-3.5 py-1 text-xs font-bold text-brand-500 uppercase tracking-wider mb-4">
            <Sparkles size={14} />
            <span>Plano Personalizado</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mb-4 leading-tight">
            Ainda não te conhecemos direito!
          </h2>

          {/* Body */}
          <p className="text-sm sm:text-base text-secondary mb-8 leading-relaxed font-medium">
            Faça uma avaliação rápida de 2 minutos para calibrarmos o seu plano de estudos e recomendar as trilhas certas para o seu ritmo.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleStartNow}
              size="lg"
              className="flex-1"
            >
              <span>Fazer agora</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleDismiss}
              variant="secondary"
              size="lg"
              className="flex-1 sm:flex-none"
            >
              Depois
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>Leva menos de 2 minutos</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
