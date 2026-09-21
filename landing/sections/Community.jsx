import { CheckCircle2, Award } from 'lucide-react'
import { Reveal, SectionHeader } from '../components/Reveal'
import { CountUp } from '../components/CountUp'

const avatarColors = ['#F06539', '#2196F3', '#F7DF1E', '#9B9DD4', '#818cf8', '#F4725B', '#34d399', '#60A5FA', '#FF8A5C']
const avatarInitials = ['A', 'D', 'L', 'M', 'R', 'S', 'T', 'V', 'C']

const communityPoints = [
  'Aprendem juntos nas mesmas trilhas de programação',
  'Compartilham conquistas em cards prontos para redes sociais',
  'Mostram sua evolução em perfis públicos',
  'Incentivam quem está começando agora',
]

export function Community() {
  return (
    <section id="comunidade" className="relative overflow-hidden py-20 sm:py-28" aria-labelledby="comunidade-title">
      <div
        className="pointer-events-none absolute right-[-160px] bottom-0 h-[380px] w-[380px] rounded-full bg-brand-500/10 blur-[110px]"
        aria-hidden="true"
      />
      <div className="wrap grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeader
            align="left"
            eyebrow="feed"
            title={
              <>
                Você não precisa <span className="text-accent">aprender sozinho.</span>
              </>
            }
            id="comunidade-title"
          >
            <p>
              A WebStart é uma comunidade de pessoas aprendendo tecnologia: trocando conhecimento, celebrando conquistas
              e evoluindo visivelmente juntas.
            </p>
          </SectionHeader>

          <Reveal delay={0.12} className="mt-6 inline-flex items-baseline gap-3 rounded-2xl border-3 border-brand-800 bg-brand-500 px-5 py-4 text-white shadow-[5px_5px_0_0_#022c22]">
            <span className="text-4xl font-black tabular-nums sm:text-5xl">
              <CountUp value={90} prefix="+" />
            </span>
            <span className="text-sm font-bold leading-tight">
              membros já fazem
              <br />
              parte da WebStart
            </span>
          </Reveal>

          <ul className="mt-8 space-y-3" role="list">
            {communityPoints.map((point, i) => (
              <Reveal as="li" key={point} delay={0.16 + i * 0.06} y={14}>
                <p className="flex items-start gap-2.5 text-secondary">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-400" aria-hidden="true" />
                  {point}
                </p>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.4} className="mt-8">
            <p className="text-sm font-semibold text-muted">E isso é só o começo — o melhor ainda está por vir.</p>
          </Reveal>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
          <div className="relative flex flex-wrap justify-center gap-4 rounded-3xl border-2 border-border bg-surface p-8 sm:p-10">
            {avatarInitials.map((initial, i) => (
              <div
                key={i}
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-canvas text-lg font-black text-gray-900 shadow-brutal-sm ${i % 2 === 0 ? 'animate-float' : 'animate-float-delayed'}`}
                style={{ backgroundColor: avatarColors[i], animationDelay: `${(i % 4) * 0.7}s` }}
              >
                {initial}
              </div>
            ))}
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-brand-400 bg-accent-soft text-sm font-black text-accent">
              +81
            </div>
          </div>

          <div className="absolute -bottom-8 left-1/2 w-[240px] -translate-x-1/2 rotate-[-2deg] rounded-2xl border-3 border-brand-800 bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white shadow-[6px_6px_0_0_#022c22] animate-float-delayed sm:w-[280px]">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-100">Card compartilhável</p>
            <p className="mt-1.5 flex items-center gap-2 font-black">
              <Award size={18} aria-hidden="true" />
              Primeiro Website
            </p>
            <p className="mt-0.5 text-xs font-semibold text-brand-100">Conquista desbloqueada · +100 XP</p>
          </div>
        </div>
      </div>
    </section>
  )
}

