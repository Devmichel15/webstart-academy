import { ThemeToggle } from '../ui/ThemeToggle'
import { useProgress } from '../../hooks/useProgress.js'
import { Badge } from '../ui/Badge'

export function Header({ title, subtitle }) {
  const { level, xp, streak } = useProgress()

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-brand-700 dark:text-brand-300">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Badge>Nível {level}</Badge>
        <Badge variant="success">{xp} XP</Badge>
        {streak > 0 && <Badge variant="warning">{streak} dias</Badge>}
        <ThemeToggle />
      </div>
    </header>
  )
}
