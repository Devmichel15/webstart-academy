import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, ArrowRight, Clock } from 'lucide-react'

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-w-lg w-full bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.6)] text-white text-center overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-500/10 rounded-full blur-[90px] pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plano Personalizado</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
            Ainda não te conhecemos direito!
          </h2>

          {/* Body */}
          <p className="text-sm sm:text-base text-slate-300 mb-8 leading-relaxed">
            Faça uma avaliação rápida de 2 minutos para calibrarmos o seu plano de estudos e recomendar as trilhas certas para o seu ritmo.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStartNow}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all cursor-pointer text-sm"
            >
              <span>Fazer agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all cursor-pointer text-sm"
            >
              Depois
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Leva menos de 2 minutos</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
