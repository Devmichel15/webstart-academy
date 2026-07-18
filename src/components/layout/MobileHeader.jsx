import { Menu } from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Badge } from '../ui/Badge'
import { useProgress } from '../../hooks/useProgress.js'

export function MobileHeader({ onMenuToggle }) {
  const { level, xp, streak } = useProgress()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-strong bg-surface lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <div>
            <p className="text-sm font-black leading-none text-primary">WebStart</p>
            <p className="text-[10px] font-semibold text-secondary">Academy</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent transition hover:border-strong hover:bg-surface-hover"
            aria-label="Abrir menu de navegação"
          >
            <Menu size={22} className="text-primary" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border px-4 py-1.5">
        <Badge className="text-[10px]">Nível {level}</Badge>
        <Badge variant="success" className="text-[10px]">{xp} XP</Badge>
        {streak > 0 && <Badge variant="warning" className="text-[10px]">{streak} dias</Badge>}
      </div>
    </header>
  )
}
