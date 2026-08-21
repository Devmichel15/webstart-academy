import { Reveal, SectionHeader } from '../components/Reveal'
import { TrailCard } from '../components/mockups/TrailCard'
import { trails, instructors } from '../data/content'

export function Trails() {
  const availableCount = trails.filter((t) => t.status === 'available').length

  return (
    <section id="trilhas" className="relative py-20 sm:py-28" aria-labelledby="trilhas-title">
      <div className="wrap">
        <SectionHeader
          eyebrow="+12 trilhas de aprendizagem"
          title={
            <>
              Tudo o que você precisa <span className="text-accent">para começar.</span>
            </>
          }
          id="trilhas-title"
        >
          <p>
            Explore conteúdos gratuitos, siga trilhas estruturadas com pré-requisitos e ordem definida, e avance no seu
            próprio ritmo — do primeiro <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[0.9em] text-accent">&lt;h1&gt;</code> ao seu primeiro deploy.
          </p>
        </SectionHeader>

        <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
          <span className="rounded-full border-2 border-brand-500/50 bg-accent-soft px-3 py-1.5 text-brand-400">
            {availableCount} trilhas disponíveis agora
          </span>
          <span className="rounded-full border-2 border-border bg-surface px-3 py-1.5 text-secondary">
            + novas trilhas em construção
          </span>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">
          {trails.map((trail, i) => (
            <TrailCard key={trail.id} trail={trail} index={i} />
          ))}
        </div>

        <Reveal delay={0.15} className="mt-12 text-center">
          <p className="text-sm font-semibold text-muted">
            Conteúdo com instrutores convidados como{' '}
            <span className="text-secondary">{instructors.join(' e ')}</span>.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
