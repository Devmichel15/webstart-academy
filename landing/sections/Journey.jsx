import { motion, useReducedMotion } from 'framer-motion'
import { Reveal, SectionHeader } from '../components/Reveal'
import { journeySteps } from '../data/content'

export function Journey() {
  const reduced = useReducedMotion()

  return (
    <section id="jornada" className="relative py-20 sm:py-28" aria-labelledby="jornada-title">
      <div className="wrap">
        <SectionHeader
          eyebrow="do zero ao primeiro deploy"
          title={
            <>
              Comece sem saber nada. <span className="text-accent">Evolua dentro de um ecossistema.</span>
            </>
          }
          id="jornada-title"
        >
          <p>Este é o caminho que cada membro da WebStart percorre — no seu ritmo, mas nunca sozinho.</p>
        </SectionHeader>

        <ol className="relative mx-auto mt-16 max-w-3xl" role="list">
          <div className="absolute bottom-4 left-[27px] top-4 w-0.5 bg-border" aria-hidden="true" />
          <motion.div
            className="absolute left-[27px] top-4 w-0.5 origin-top bg-gradient-to-b from-brand-400 to-brand-600"
            style={{ bottom: '1rem' }}
            initial={reduced ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            aria-hidden="true"
          />

          {journeySteps.map((item, i) => (
            <Reveal as="li" key={item.step} delay={Math.min(i * 0.12, 0.6)} y={20}>
              <div className="relative flex gap-6 pb-10 last:pb-0">
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-3 border-brand-800 bg-brand-500 font-mono text-sm font-black text-white shadow-brutal-sm">
                  {item.step}
                </div>
                <div className="flex-1 rounded-2xl border-2 border-border bg-surface p-5 transition-colors hover:border-brand-500/50 sm:p-6">
                  <h3 className="text-lg font-black tracking-wide">{item.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-secondary">{item.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
