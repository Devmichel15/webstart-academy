import { motion, useReducedMotion } from 'framer-motion'
import { Trophy, Flame, Target, Award, Zap } from 'lucide-react'
import { CountUp } from '../CountUp'
import { featuredAchievements } from '../../data/content'

export function PlayerCardMock() {
  const reduced = useReducedMotion()
  const percent = 58

  return (
    <div className="relative">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 32, rotate: 1.5 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, margin: '-64px' }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative overflow-hidden rounded-2xl border-3 border-brand-800 bg-surface shadow-[6px_6px_0_0_#34d39955] sm:max-w-md"
      >
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-100">Player Card</p>
              <h3 className="mt-1 text-2xl font-black">Você</h3>
              <p className="mt-1 text-sm font-semibold text-brand-100">Nível 12 · 11585 XP · 7 dias seguidos</p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-3 border-white/30 bg-white/20 text-2xl font-black">
              12
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4">
          <Stat icon={Trophy} label="XP" value={<CountUp value={11585} />} />
          <Stat icon={Flame} label="Streak" value={<><span className="animate-flame">7</span>d</>} flame />
          <Stat icon={Target} label="Conquistas" value="6/12" />
        </div>

        <div className="px-4 pb-4">
          <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-secondary">
            Nível 12 → 13 · 585/1000 XP
          </p>
          <div className="h-3 overflow-hidden rounded-full border-2 border-border bg-elevated">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
              initial={reduced ? false : { width: '0%' }}
              whileInView={{ width: `${percent}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="border-t-2 border-border px-4 py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary">Conquistas recentes</p>
          <div className="flex flex-wrap gap-2">
            {featuredAchievements.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-brand-500/40 bg-accent-soft px-2 py-1 text-[11px] font-bold text-accent"
              >
                {a.title}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <FloatChip
        className="-right-2 -top-6 animate-float sm:-right-8"
        icon={<Award size={18} className="text-brand-400" aria-hidden="true" />}
        title="Conquista desbloqueada"
        sub="Primeiro Website · +100 XP"
        reduced={reduced}
        delay={0.65}
      />

      <FloatChip
        className="-bottom-6 -left-2 animate-float-delayed sm:-left-10"
        icon={<Zap size={18} className="text-yellow-400" aria-hidden="true" />}
        title="+50 XP"
        sub="Aula concluída"
        reduced={reduced}
        delay={0.8}
      />
    </div>
  )
}

function Stat({ icon: Icon, label, value, flame = false }) {
  return (
    <div className="rounded-xl border-2 border-border bg-surface-hover p-3 text-center">
      <Icon className={`mx-auto mb-1 h-5 w-5 text-brand-400 ${flame ? 'animate-flame' : ''}`} aria-hidden="true" />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">{label}</p>
      <p className="text-lg font-black tabular-nums">{value}</p>
    </div>
  )
}

function FloatChip({ className, icon, title, sub, reduced, delay }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`absolute z-10 hidden items-center gap-2.5 rounded-xl border-2 border-strong bg-elevated px-3 py-2 shadow-brutal-sm sm:flex ${className}`}
    >
      {icon}
      <div className="leading-tight">
        <p className="text-xs font-black">{title}</p>
        <p className="text-[10px] font-semibold text-secondary">{sub}</p>
      </div>
    </motion.div>
  )
}
