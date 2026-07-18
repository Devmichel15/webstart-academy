import { ThemeToggle } from '../ui/ThemeToggle'
import { useProgress } from '../../hooks/useProgress.js'
import { Badge } from '../ui/Badge'

export function Header({ title, subtitle }) {
  const { level, xp, streak } = useProgress()

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-primary md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-secondary">{subtitle}</p>}
      </div>
      <div className="hidden items-center gap-2 lg:flex">
        <Badge>Nível {level}</Badge>
        <Badge variant="success">{xp} XP</Badge>
        {streak > 0 && <Badge variant="warning">{streak} dias</Badge>}
        <ThemeToggle />
      </div>
    </header>
  )
}
