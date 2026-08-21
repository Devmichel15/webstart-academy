import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { CountUp } from '../components/CountUp'
import { PlayerCardMock } from '../components/mockups/PlayerCardMock'

export function Hero() {
  const reduced = useReducedMotion()

  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-36 lg:pb-28" aria-labelledby="hero-title">
      <div className="bg-grid hero-fade pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-[-200px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[130px]"
        aria-hidden="true"
      />

      <div className="wrap relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand-500/40 bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent"
          >
            <Sparkles size={14} aria-hidden="true" />
            Comunidade de programadores · 100% gratuita
          </motion.p>

          <motion.h1
            id="hero-title"
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl xl:text-7xl"
          >
            Seu próximo projeto <span className="text-accent">começa aqui.</span>
          </motion.h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-secondary sm:text-xl"
          >
            Aprenda programação gratuitamente, construa projetos reais e faça parte de uma comunidade que está
            construindo o futuro da tecnologia.
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="/registro"
              className="brutal-btn brutal-btn-solid inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-lg font-black text-white hover:bg-brand-600"
            >
              Começar gratuitamente
              <ArrowRight size={20} aria-hidden="true" />
            </a>
            <a
              href="#metodo"
              className="brutal-btn inline-flex items-center gap-2 rounded-xl border-3 border-strong bg-surface px-7 py-3.5 text-lg font-black text-primary hover:bg-surface-hover hover:border-brand-500"
            >
              Explorar a WebStart
            </a>
          </motion.div>

          <motion.dl
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-10 flex flex-wrap gap-x-8 gap-y-4"
          >
            <HeroStat label="membros estudando juntos">
              <CountUp value={90} prefix="+" suffix="" />
            </HeroStat>
            <HeroStat label="trilhas e cursos">
              <CountUp value={12} prefix="+" />
            </HeroStat>
            <HeroStat label="gratuito, sempre">100%</HeroStat>
          </motion.dl>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <PlayerCardMock />
        </div>
      </div>
    </section>
  )
}

function HeroStat({ label, children }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-black tabular-nums text-primary sm:text-3xl">
        {children} <span className="ml-1 align-middle text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      </dd>
    </div>
  )
}
