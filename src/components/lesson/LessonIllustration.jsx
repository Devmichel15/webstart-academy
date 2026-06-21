import {
  Award,
  Beaker,
  BookOpen,
  Code2,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Palette,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'

const iconMap = {
  dashboard: LayoutDashboard,
  courses: BookOpen,
  lab: Beaker,
  materials: GraduationCap,
  profile: Award,
  code: Code2,
  palette: Palette,
  sparkles: Sparkles,
  flame: Flame,
  trophy: Trophy,
  target: Target,
}

export function LessonIllustration({ type = 'code', className = '' }) {
  const Icon = iconMap[type] || Code2

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-3 border-brand-800 bg-gradient-to-br from-brand-100 via-white to-brand-200 p-8 dark:border-brand-400 dark:from-brand-950 dark:via-brand-900 dark:to-brand-800 ${className}`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-300/40 blur-2xl dark:bg-brand-500/20" />
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-brand-400/30 blur-xl dark:bg-brand-600/20" />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-3 border-brand-800 bg-brand-500 text-white shadow-[4px_4px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[4px_4px_0_0_#34d399]">
          <Icon size={36} strokeWidth={2.5} />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-brand-700 dark:text-brand-300">
          WebStart Academy
        </p>
      </div>
    </div>
  )
}
