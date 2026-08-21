import { Reveal } from '../components/Reveal'

const lines = [
  'Acreditamos que aprender tecnologia não deveria ser privilégio de quem pode pagar.',
  'Que qualquer pessoa deveria poder abrir o computador e começar a construir.',
  'Que programação não é apenas código.',
]

export function Manifesto() {
  return (
    <section id="manifesto" className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 py-24 text-brand-950 sm:py-32" aria-labelledby="manifesto-title">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.08] invert" aria-hidden="true" />
      <div className="wrap relative">
        <Reveal>
          <p className="font-mono text-sm font-bold uppercase tracking-widest text-brand-950/70">nosso manifesto</p>
        </Reveal>

        <div className="mt-8 max-w-4xl space-y-6">
          {lines.map((line, i) => (
            <Reveal key={line} delay={0.1 + i * 0.15}>
              <p className="text-2xl font-black leading-snug sm:text-3xl lg:text-4xl">
                {line}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.55}>
            <p className="text-2xl font-black leading-snug sm:text-3xl lg:text-4xl">
              É criatividade. É oportunidade. É transformar uma ideia em realidade.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.75} className="mt-14">
          <p id="manifesto-title" className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            É por isso que existe a WebStart.
          </p>
          <p className="mt-6 font-mono text-sm font-semibold text-brand-950/70">— comunidade WebStart</p>
        </Reveal>
      </div>
    </section>
  )
}
