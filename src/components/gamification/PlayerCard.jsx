import { Flame, Trophy, Award, Target, Code2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { getXpForNextLevel } from '../../utils/xp.js'
import { getPublicProfileUrl } from '../../utils/username'

export function PlayerCard({ user, rank, rankPercentile, showLink = true, compact = false }) {
  const xpInfo = getXpForNextLevel(user.xp || 0)
  const profileUrl = user.username ? getPublicProfileUrl(user.username) : null

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border-3 border-brand-800 bg-gradient-to-r from-brand-500/10 to-emerald-500/10 p-4 dark:border-brand-400">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-3 border-brand-800 bg-brand-500 text-xl font-black text-white dark:border-brand-400">
          {user.level || 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black">{user.name}</p>
          <p className="text-sm font-semibold text-secondary">
            Nv. {user.level} · {user.xp} XP · 🔥 {user.streak || 0}d
          </p>
        </div>
        {user.latestBadge && <Badge>{user.latestBadge}</Badge>}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border-3 border-brand-800 bg-surface shadow-[6px_6px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[6px_6px_0_0_#34d399]">
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-100">Player Card</p>
            <h2 className="mt-1 text-2xl font-black">{user.name}</h2>
            {rankPercentile && (
              <p className="mt-1 text-sm font-semibold text-brand-100">
                Top {rankPercentile}% HTML learners
              </p>
            )}
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-3 border-white/30 bg-white/20 text-2xl font-black">
            {user.level || 1}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4">
        <Stat icon={Trophy} label="XP" value={user.xp || 0} />
        <Stat icon={Flame} label="Streak" value={`${user.streak || 0}d`} />
        <Stat icon={Target} label="Aulas" value={user.completedCount || 0} />
      </div>

      <div className="px-4 pb-4">
        <ProgressBar
          value={xpInfo.percent}
          label={`Nível ${user.level} → ${user.level + 1} (${xpInfo.current}/${xpInfo.needed} XP)`}
        />
      </div>

      {(user.completedExercises > 0 || user.completedProjects > 0) && (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {user.completedExercises > 0 && (
            <Stat icon={Code2} label="Exercícios" value={user.completedExercises} small />
          )}
          {user.completedProjects > 0 && (
            <Stat icon={Award} label="Projetos" value={user.completedProjects} small />
          )}
        </div>
      )}

      {user.achievements?.length > 0 && (
        <div className="border-t-2 border px-4 py-4">
          <p className="mb-2 text-sm font-bold text-secondary">Badges</p>
          <div className="flex flex-wrap gap-2">
            {user.achievements.slice(0, 6).map((badge) => (
              <Badge key={badge.id}>{badge.title}</Badge>
            ))}
          </div>
        </div>
      )}

      {rank && (
        <div className="border-t-2 border px-4 py-3 text-sm font-bold text-secondary">
          Ranking global: #{rank}
        </div>
      )}

      {showLink && profileUrl && (
        <div className="border-t-2 border bg-surface-hover px-4 py-3 text-xs font-semibold text-secondary">
          {profileUrl.replace(/^https?:\/\//, '')}
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, small = false }) {
  return (
    <div className={`rounded-xl border-2 border bg-surface-hover text-center ${small ? 'p-2' : 'p-3'}`}>
      <Icon className={`mx-auto mb-1 text-brand-500 ${small ? 'h-4 w-4' : 'h-5 w-5'}`} />
      <p className="text-xs font-semibold text-secondary">{label}</p>
      <p className={`font-black ${small ? 'text-base' : 'text-lg'}`}>{value}</p>
    </div>
  )
}
