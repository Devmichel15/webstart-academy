import { ArrowDown, MonitorPlay } from 'lucide-react'
import { Reveal, SectionHeader } from '../components/Reveal'
import { CodeWindow } from '../components/mockups/CodeWindow'

const flow = ['APRENDER', 'PRATICAR', 'CONSTRUIR']

export function Projects() {
  return (
    <section id="projetos" className="relative py-20 sm:py-28" aria-labelledby="projetos-title">
      <div className="wrap">
        <SectionHeader
          eyebrow="mão na massa"
          title={
            <>
              Não basta terminar cursos. <span className="text-accent">Você precisa saber construir.</span>
            </>
          }
          id="projetos-title"
        >
          <p>
            No Laboratório WebStart você escreve HTML e CSS em um editor com preview ao vivo. Nos mini-projetos e no
            projeto final de cada trilha, você entrega algo que funciona — e que pode mostrar para qualquer pessoa.
          </p>
        </SectionHeader>

        <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {flow.map((step, i) => (
            <div key={step} className="flex items-center gap-2 sm:gap-3">
              <span className="rounded-lg border-2 border-border bg-surface px-4 py-2 font-mono text-sm font-black tracking-wider">
                {step}
              </span>
              {i < flow.length - 1 && <ArrowDown className="h-4 w-4 rotate-[-90deg] text-muted" aria-hidden="true" />}
            </div>
          ))}
        </Reveal>

        <div className="relative mx-auto mt-12 max-w-4xl">
          <div
            className="pointer-events-none absolute inset-x-8 -bottom-6 h-full rounded-xl bg-brand-500/15 blur-2xl"
            aria-hidden="true"
          />
          <CodeWindow />
        </div>

        <Reveal delay={0.2} className="mt-14 grid gap-4 text-center sm:grid-cols-3">
          {[
            { title: 'Editor ao vivo', text: 'Escreva código e veja o resultado instantaneamente.' },
            { title: 'Console integrado', text: 'Acompanhe a execução sem sair da plataforma.' },
            { title: 'Desafios guiados', text: 'Cada módulo termina com prática e projeto real.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border-2 border-border bg-surface p-5">
              <MonitorPlay className="mx-auto h-5 w-5 text-accent" aria-hidden="true" />
              <h3 className="mt-2 font-black">{item.title}</h3>
              <p className="mt-1 text-sm text-secondary">{item.text}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
