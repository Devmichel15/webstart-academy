import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Clock } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { SEO } from '../seo/SEO'

export function AssessmentIntroScreen({ onStart }) {
  return (
    <>
      <SEO
        title="Avaliação de Perfil"
        description="Descubra seu perfil de aprendizagem e receba um plano de estudos personalizado na WebStart Academy."
        url="/avaliacao-perfil"
      />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="brutal-card w-full max-w-lg rounded-2xl p-8 text-center"
        >
          {/* Platform Logo */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-3 border-brand-700 bg-brand-950 shadow-brutal p-3">
            <img src="/logo.svg" alt="WebStart Academy" className="h-full w-full object-contain" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand-700 bg-brand-950 px-3.5 py-1 text-xs font-bold text-brand-400 uppercase tracking-wider mb-4">
            <Sparkles size={14} />
            <span>Perfil Personalizado WebStart</span>
          </div>

          {/* Heading */}
          <h1 className="mb-3 text-2xl sm:text-3xl font-black text-primary leading-snug">
            Vamos te conhecer antes de começar.
          </h1>

          {/* Description */}
          <p className="mb-8 text-sm sm:text-base text-secondary max-w-md mx-auto font-medium">
            Sete perguntas rápidas para montarmos o caminho ideal pra você — sem perder tempo com o que você já sabe ou não precisa.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col gap-3">
            <Button onClick={onStart} size="lg" className="w-full">
              Começar avaliação
              <ArrowRight size={20} className="ml-1" />
            </Button>

            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-muted">
              <Clock size={14} />
              <span>leva menos de 2 minutos</span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
