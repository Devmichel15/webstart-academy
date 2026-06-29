import { Sparkles } from 'lucide-react'
import { PremiumFeatureCard } from './PremiumFeatureCard'
import { PremiumCTA } from './PremiumCTA'
import { PREMIUM_FEATURES, GOOGLE_HTML_PAYMENT_FORM_URL } from '../../config/premium.js'

export function PremiumPage({ trail }) {
  const courseTitle = trail?.title || 'HTML5'
  const formUrl = GOOGLE_HTML_PAYMENT_FORM_URL

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 overflow-hidden rounded-3xl border-3 border-brand-800 bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white shadow-[8px_8px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[8px_8px_0_0_#34d399]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-3 border-white/30 bg-white/10">
          <Sparkles size={32} />
        </div>
        <h1 className="mb-3 text-3xl font-black md:text-4xl">
          Desbloqueia a Trilha de {courseTitle}
        </h1>
        <p className="max-w-2xl text-lg text-brand-100">
          Chegou a hora de aprender HTML como um desenvolvedor profissional.
        </p>
      </div>

      {trail?.requiredTrail && (
        <div className="mb-8 rounded-2xl border-2 border-brand-800/30 bg-gradient-to-r from-brand-500/5 to-transparent p-5 dark:border-brand-400/20">
          <p className="text-sm font-bold leading-relaxed text-primary">
            Já concluíste <span className="text-brand-600 dark:text-brand-400">Fundamentos Web</span>.
            <br />
            Agora estás preparado para começar a desenvolver websites reais.
          </p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-black text-primary">O que está incluído</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PREMIUM_FEATURES.map((feature) => (
            <PremiumFeatureCard
              key={feature.label}
              label={feature.label}
              description={feature.description}
            />
          ))}
        </div>
      </div>

      <div className="text-center">
        <PremiumCTA formUrl={formUrl} courseTitle={courseTitle} />
      </div>
    </div>
  )
}
