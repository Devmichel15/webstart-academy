import { Trophy, Flame, Zap } from 'lucide-react'
import { Reveal, SectionHeader } from '../components/Reveal'
import { PlayerCardMock } from '../components/mockups/PlayerCardMock'
import { xpTable, streakBonuses } from '../data/content'

export function Gamification() {
  return (
    <section id="progresso" className="relative overflow-hidden py-20 sm:py-28" aria-labelledby="progresso-title">
      <div
        className="pointer-events-none absolute left-[-160px] top-1/4 h-[360px] w-[360px] rounded-full bg-brand-500/10 blur-[110px]"
        aria-hidden="true"
      />
      <div className="wrap grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 mx-auto w-full max-w-md lg:order-1 lg:max-w-none">
          <PlayerCardMock />
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeader
            align="left"
            eyebrow="gamificação de verdade"
            title={
              <>
                Transforme aprendizado em <span className="text-accent">progresso.</span>
              </>
            }
            id="progresso-title"
          >
            <p>
              Cada aula concluída representa progresso. Cada desafio vencido aumenta sua experiência. Cada conquista
              mostra até onde você chegou. Não é pontuação decorativa — é o registro da sua evolução.
            </p>
          </SectionHeader>

          <Reveal delay={0.15} className="mt-8 rounded-2xl border-2 border-border bg-surface p-5">
            <h3 className="flex items-center gap-2 font-black">
              <Zap size={16} className="text-yellow-400" aria-hidden="true" />
              Como você ganha XP
            </h3>
            <ul className="mt-3 divide-y-2 divide-border" role="list">
              {xpTable.map((row) => (
                <li key={row.activity} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-semibold text-secondary">{row.activity}</span>
                  <span className="font-mono font-bold text-accent">+{row.xp} XP</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.22} className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-500/50 bg-orange-500/10 px-4 py-2.5">
              <Flame className="animate-flame h-4 w-4 text-orange-400" aria-hidden="true" />
              <span className="text-sm font-bold">Streak diário com bônus</span>
            </div>
            {streakBonuses.map((b) => (
              <span
                key={b.days}
                className="rounded-lg border-2 border-border bg-surface px-3 py-2 font-mono text-xs font-bold text-secondary"
              >
                {b.days} dias <span className="text-accent">{b.bonus}</span>
              </span>
            ))}
          </Reveal>

          <Reveal delay={0.28} className="mt-6 flex items-center gap-2 text-sm font-semibold text-muted">
            <Trophy size={16} className="text-brand-400" aria-hidden="true" />
            12 conquistas para desbloquear, do Primeiro Passo ao WebStart Graduate.
          </Reveal>
        </div>
      </div>
    </section>
  )
}
