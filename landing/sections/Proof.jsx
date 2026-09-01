import { Reveal } from '../components/Reveal'
import { CountUp } from '../components/CountUp'
import { stats } from '../data/content'

const items = [
  { value: stats.members, prefix: '+', suffix: '', label: 'membros na comunidade' },
  { value: stats.trails, prefix: '+', suffix: '', label: 'trilhas e cursos' },
  { value: stats.achievements, prefix: '', suffix: '', label: 'conquistas para desbloquear' },
  { value: 100, prefix: '', suffix: '%', label: 'gratuito. sempre.' },
]

const testimonials = [
  {
    quote:
      'Eu estudo Informática há 3 anos e, desde que entrei para o ensino médio, sempre amei desenvolver coisas, nesse caso, programar. Há um mês conheci um cara chamado Michel que, por coincidência, também é programador e me fez conhecer a WebStart Academy, o que tem sido bastante proveitoso. Ter aulas sob medida com mentores que sabem o que fazem é muito bom!',
    name: 'Jovem Sardinha',
  },
  {
    quote:
      'Eu estava à procura de uma forma de estudar programação. Já estudei várias vezes e nada resultava por falta de consistência em um só conteúdo: assistia a vários vídeos de vários canais e nada. Até o dia em que encontrei a WebStart. Começou com um grupo no WhatsApp e hoje temos uma plataforma web, com os cursos organizados em módulos, aulas em vídeo e Inteligência Artificial ao nosso dispor. Sendo sincero, meus estudos avançaram quando entrei na WebStart. Muito obrigado ao Michel e à WebStart.',
    name: 'Gustavo Fama',
  },
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

        <Reveal delay={0.35} className="mt-14">
          <div className="grid gap-6 lg:grid-cols-2">
            {testimonials.map((testimonial) => (
              <blockquote key={testimonial.name} className="brutal-card flex h-full flex-col justify-between p-6 sm:p-8">
                <p className="text-base font-semibold leading-relaxed text-secondary">“{testimonial.quote}”</p>
                <footer className="mt-6 border-t-2 border-border pt-4 text-sm font-black text-accent">
                  — {testimonial.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
