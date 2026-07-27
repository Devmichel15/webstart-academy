import { motion } from 'framer-motion'
import { Rocket, Clock, CheckCircle2, ArrowRight, UserCheck } from 'lucide-react'
import { trails as allTrails } from '../../data/trails.js'
import { ARCHETYPE_DESCRIPTIONS } from '../../utils/archetypes.js'
import { Button } from '../ui/Button.jsx'

export function AssessmentResultScreen({ archetype, roadmap, onStartJourney }) {
  const archetypeDesc = ARCHETYPE_DESCRIPTIONS[archetype] || 'Seu perfil foi identificado com sucesso.'

  const recommendedTrailObjects = (roadmap?.recommendedCourses || [])
    .map((id) => allTrails.find((t) => t.id === id))
    .filter(Boolean)

  const firstTrail = recommendedTrailObjects[0]

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 overflow-hidden selection:bg-accent selection:text-white">
      {/* Background glow — same as all other screens */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 max-w-lg w-full flex flex-col items-center text-center my-auto"
      >
        {/* Archetype Badge — same pill style as intro badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-strong bg-elevated px-3.5 py-1 text-xs font-bold text-accent uppercase tracking-wider mb-5">
          <UserCheck className="w-4 h-4" />
          <span>Perfil Identificado: {archetype}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary mb-4 leading-tight">
          Seu Plano Personalizado{' '}
          <span className="text-accent">está Pronto.</span>
        </h1>

        {/* AI Summary Card — brutal-card */}
        <div className="brutal-card w-full rounded-2xl p-6 text-left mb-7">
          <p className="text-secondary text-sm sm:text-base leading-relaxed mb-3 font-medium">
            "{roadmap?.aiSummary || archetypeDesc}"
          </p>
          {roadmap?.welcomeMessage && (
            <p className="text-accent text-xs sm:text-sm font-bold italic border-t border-strong pt-3">
              — {roadmap.welcomeMessage}
            </p>
          )}
        </div>

        {/* Recommended Trails */}
        <div className="w-full text-left mb-7">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              Trilhas Recomendadas
            </h3>
            {roadmap?.estimatedWeeks && (
              <span className="inline-flex items-center gap-1.5 text-xs text-accent font-bold bg-accent-soft px-2.5 py-1 rounded-lg border border-strong">
                <Clock className="w-3.5 h-3.5" />
                ~{roadmap.estimatedWeeks} semanas
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {recommendedTrailObjects.map((trail, index) => {
              const isFirst = index === 0

              return (
                <div
                  key={trail.id}
                  className={`p-4 rounded-xl border-3 flex items-center justify-between gap-4 transition-all ${
                    isFirst
                      ? 'bg-accent-soft border-accent shadow-brutal-sm'
                      : 'brutal-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border-2 ${
                        isFirst
                          ? 'bg-accent text-white border-accent'
                          : 'bg-elevated text-muted border-strong'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm sm:text-base text-primary">{trail.title}</span>
                        {isFirst && (
                          <span className="px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase">
                            Comece aqui
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted line-clamp-1 font-medium">{trail.description}</p>
                    </div>
                  </div>

                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 ${isFirst ? 'text-accent' : 'text-muted'}`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA — reuse existing Button component */}
        <Button onClick={onStartJourney} size="lg" className="w-full mb-3">
          <Rocket className="w-5 h-5" />
          Começar minha jornada
          <ArrowRight className="w-5 h-5" />
        </Button>

        <button
          onClick={onStartJourney}
          className="text-xs font-bold text-muted hover:text-secondary hover:underline transition-colors cursor-pointer"
        >
          Ver detalhes do plano depois no meu perfil
        </button>
      </motion.div>
    </div>
  )
}
