import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { ShareCard } from '../share/ShareCard'
import { ShareButtons } from '../share/ShareButtons'
import { Button } from '../ui/Button'

export function AchievementCelebration({ open, onClose, shareData }) {
  if (!shareData) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border-3 border-brand-800 bg-surface p-6 shadow-2xl dark:border-brand-400"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-secondary hover:bg-surface-hover"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <div className="mb-4 flex items-center gap-2 text-brand-600">
              <Sparkles size={22} />
              <h2 className="text-xl font-black">Conquista desbloqueada!</h2>
            </div>

            <ShareCard {...shareData} />

            <p className="my-4 text-center text-sm font-semibold text-secondary">
              Partilha a tua conquista e convida amigos para a WebStart
            </p>

            <ShareButtons shareData={shareData} className="justify-center" />

            <Button variant="ghost" className="mt-4 w-full" onClick={onClose}>
              Continuar
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
