import { ArrowRight } from 'lucide-react'
import { Reveal } from '../components/Reveal'

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32" aria-labelledby="cta-final-title">
      <div className="bg-grid hero-fade pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="glow-accent pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/15 blur-[100px]"
        aria-hidden="true"
      />

      <div className="wrap relative text-center">
        <Reveal>
          <p className="font-mono text-sm font-semibold tracking-wider text-accent">{'// sua vez'}</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 id="cta-final-title" className="mx-auto mt-4 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Comece a construir seu futuro na tecnologia.
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-secondary sm:text-xl">
            A próxima habilidade que você aprender pode mudar o que você consegue construir amanhã.
          </p>
        </Reveal>

        <Reveal delay={0.24} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/registro"
            className="brutal-btn brutal-btn-solid inline-flex items-center gap-2 rounded-xl bg-brand-500 px-9 py-4 text-xl font-black text-white hover:bg-brand-600"
          >
            Começar gratuitamente
            <ArrowRight size={22} aria-hidden="true" />
          </a>
        </Reveal>

        <Reveal delay={0.32}>
          <p className="mt-8 text-sm font-semibold text-muted">
            Já estuda aqui?{' '}
            <a href="/login" className="font-bold text-accent underline-offset-4 hover:underline">
              Entrar na minha conta
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
