import { Youtube, Shuffle, Compass, Gauge, UserX, BatteryLow } from 'lucide-react'
import { Reveal, SectionHeader } from '../components/Reveal'

const pains = [
  {
    icon: Youtube,
    title: 'Dezenas de vídeos soltos',
    text: 'Conteúdo demais, direção de menos. Você assiste, assiste e não sai do lugar.',
  },
  {
    icon: Shuffle,
    title: 'Tutoriais desconectados',
    text: 'Cada um ensina do jeito dele. Nada se conecta, nada forma um caminho.',
  },
  {
    icon: Compass,
    title: 'Sem saber o que vem depois',
    text: 'Terminou um vídeo? E agora? Ninguém te diz qual é o próximo passo.',
  },
  {
    icon: Gauge,
    title: 'Zero noção de progresso',
    text: 'Meses estudando e a sensação é sempre a mesma: será que estou evoluindo?',
  },
  {
    icon: UserX,
    title: 'Sozinho do início ao fim',
    text: 'Sem ninguém para trocar ideia, tirar dúvida ou celebrar avanço.',
  },
  {
    icon: BatteryLow,
    title: 'Motivação que evapora',
    text: 'Sem recompensa, sem streak, sem conquista. A empolgação dura uma semana.',
  },
]

export function Problem() {
  return (
    <section id="problema" className="relative py-20 sm:py-28" aria-labelledby="problema-title">
      <div className="wrap">
        <SectionHeader
          eyebrow="a realidade de quem está começando"
          title={
            <>
              Você quer aprender programação. <span className="text-secondary">Mas por onde começa?</span>
            </>
          }
          id="problema-title"
        >
          <p>
            Quem decide entrar na tecnologia hoje encontra o mesmo cenário: muito conteúdo espalhado, pouca direção e
            nenhum sinal de progresso.
          </p>
        </SectionHeader>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {pains.map((pain, i) => (
            <Reveal as="li" key={pain.title} delay={Math.min(i * 0.06, 0.36)}>
              <div
                className={`h-full rounded-2xl border-2 border-border bg-surface p-5 ${i % 2 === 0 ? '-rotate-[0.6deg]' : 'rotate-[0.6deg]'}`}
              >
                <pain.icon className="h-6 w-6 text-muted" aria-hidden="true" />
                <h3 className="mt-3 font-black">{pain.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary">{pain.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.15} className="mt-16 text-center">
          <p className="mx-auto max-w-3xl text-2xl font-black leading-snug sm:text-3xl lg:text-4xl">
            Aprender programação não deveria ser apenas{' '}
            <span className="underline decoration-brand-500 decoration-4 underline-offset-8">assistir aulas</span>.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
