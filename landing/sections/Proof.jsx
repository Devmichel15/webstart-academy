import { Reveal } from '../components/Reveal'
import { CountUp } from '../components/CountUp'
import { stats } from '../data/content'

const items = [
  { value: stats.members, prefix: '+', suffix: '', label: 'membros na comunidade' },
  { value: stats.trails, prefix: '+', suffix: '', label: 'trilhas e cursos' },
  { value: stats.achievements, prefix: '', suffix: '', label: 'conquistas para desbloquear' },
  { value: 100, prefix: '', suffix: '%', label: 'gratuito. sempre.' },
]

export function Proof() {
  return (
    <section className="border-y-3 border-border bg-surface py-16 sm:py-20" aria-label="Números da WebStart">
      <div className="wrap">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 text-center lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal as="div" key={item.label} delay={Math.min(i * 0.08, 0.3)}>
              <dd className="text-4xl font-black tabular-nums text-accent sm:text-5xl lg:text-6xl">
                <CountUp value={item.value} prefix={item.prefix} suffix={item.suffix} />
              </dd>
              <dt className="mt-2 text-sm font-bold text-secondary">{item.label}</dt>
            </Reveal>
          ))}
        </dl>

        <Reveal delay={0.35} className="mt-14 text-center">
          <p className="mx-auto max-w-2xl text-base font-semibold leading-relaxed text-secondary">
            Aqui não existe depoimento inventado nem número inflado. Os dados são da plataforma — e as histórias de
            sucesso estão sendo escritas agora.
          </p>
          <p className="mt-3 text-lg font-black text-primary">A próxima pode ser a sua.</p>
        </Reveal>
      </div>
    </section>
  )
}
