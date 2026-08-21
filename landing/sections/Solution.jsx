import { BookOpen, FlaskConical, Hammer, TrendingUp, Users, ArrowDown } from 'lucide-react'
import { Reveal, SectionHeader } from '../components/Reveal'

const pillars = [
  {
    key: 'APRENDER',
    icon: BookOpen,
    text: 'Trilhas estruturadas do zero ao avançado, com aulas completas, quizzes e materiais de apoio.',
  },
  {
    key: 'PRATICAR',
    icon: FlaskConical,
    text: 'Laboratório com editor e preview ao vivo para transformar teoria em código, na hora.',
  },
  {
    key: 'CONSTRUIR',
    icon: Hammer,
    text: 'Mini-projetos e projeto final em cada trilha. Conhecimento só vale quando vira coisa real.',
  },
  {
    key: 'EVOLUIR',
    icon: TrendingUp,
    text: 'XP, níveis, streak diário e conquistas registrando cada avanço da sua jornada.',
  },
  {
    key: 'CONECTAR',
    icon: Users,
    text: 'Perfis públicos e uma comunidade de mais de 90 pessoas aprendendo juntas.',
  },
]

export function Solution() {
  return (
    <section id="metodo" className="relative overflow-hidden py-20 sm:py-28" aria-labelledby="metodo-title">
      <div
        className="pointer-events-none absolute right-[-180px] top-1/3 h-[380px] w-[380px] rounded-full bg-brand-500/10 blur-[110px]"
        aria-hidden="true"
      />
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader
              align="left"
              eyebrow="a resposta"
              title={
                <>
                  Foi por isso que criamos a <span className="text-accent">WebStart</span>.
                </>
              }
              id="metodo-title"
            >
              <p>
                A WebStart não é uma coleção de cursos. É um ecossistema completo de aprendizagem que reúne, em um
                único lugar gratuito, tudo o que faltava para você começar de verdade.
              </p>
            </SectionHeader>
          </div>

          <ol className="relative space-y-0" role="list">
            {pillars.map((pillar, i) => (
              <Reveal as="li" key={pillar.key} delay={Math.min(i * 0.08, 0.4)} className="relative">
                <div className="flex gap-5 pb-10 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-3 border-brand-800 bg-brand-500 font-mono text-sm font-black text-white">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    {i < pillars.length - 1 && (
                      <ArrowDown className="my-2 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    )}
                  </div>
                  <div className="rounded-2xl border-2 border-border bg-surface p-5 transition-colors hover:border-brand-500/50 sm:p-6 flex-1">
                    <h3 className="flex items-center gap-2.5 text-lg font-black tracking-wide">
                      <pillar.icon className="h-5 w-5 text-accent" aria-hidden="true" />
                      {pillar.key}
                    </h3>
                    <p className="mt-2 leading-relaxed text-secondary">{pillar.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
