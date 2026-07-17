import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircleQuestion, X } from 'lucide-react'

const IDLE_TIMEOUT = 90_000

export function ProactiveTutorTrigger({ targetId = 'ai-tutor' }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const dismissedRef = useRef(false)

  const resetTimer = useCallback(() => {
    if (dismissedRef.current) return
    setVisible(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!dismissedRef.current) setVisible(true)
    }, IDLE_TIMEOUT)
  }, [])

  useEffect(() => {
    resetTimer()

    const events = ['scroll', 'mousemove', 'keydown', 'click', 'touchstart']
    const handler = () => { if (visible) return; resetTimer() }
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }))
    return () => {
      clearTimeout(timerRef.current)
      events.forEach((e) => window.removeEventListener(e, handler))
    }
  }, [resetTimer, visible])

  const handleScrollToTutor = () => {
    setVisible(false)
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = el.querySelector('input[type="text"]')
      if (input) setTimeout(() => input.focus(), 400)
    }
  }

  const handleDismiss = () => {
    dismissedRef.current = true
    setVisible(false)
    clearTimeout(timerRef.current)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-brand-300 bg-white px-4 py-3 shadow-lg dark:border-brand-600 dark:bg-zinc-900"
        >
          <button
            onClick={handleScrollToTutor}
            className="flex items-center gap-2 text-sm font-bold text-brand-700 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-100"
          >
            <MessageCircleQuestion size={18} className="shrink-0" />
            Tens dúvidas nesta parte? Pergunta ao tutor
          </button>
          <button
            onClick={handleDismiss}
            className="ml-1 shrink-0 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
