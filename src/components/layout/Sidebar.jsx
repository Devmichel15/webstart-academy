import { NavLink } from 'react-router-dom'
import {
  Award,
  Beaker,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cursos', label: 'Cursos', icon: BookOpen },
  { to: '/laboratorio', label: 'Laboratório', icon: Beaker },
  { to: '/materiais', label: 'Materiais', icon: GraduationCap },
  { to: '/perfil', label: 'Perfil', icon: Award },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r-3 border-brand-800 bg-white p-4 dark:border-brand-400 dark:bg-brand-950 lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border-3 border-brand-800 bg-brand-500 text-white shadow-[3px_3px_0_0_#064e3b] dark:border-brand-400">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-lg font-black leading-none">WebStart</p>
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">Academy</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-3 px-3 py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? 'border-brand-800 bg-brand-500 text-white shadow-[3px_3px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[3px_3px_0_0_#34d399]'
                  : 'border-transparent text-brand-800 hover:border-brand-800 hover:bg-brand-50 dark:text-brand-200 dark:hover:border-brand-400 dark:hover:bg-brand-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t-3 border-brand-800 bg-white dark:border-brand-400 dark:bg-brand-950 lg:hidden">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold ${
              isActive ? 'text-brand-600' : 'text-brand-800 dark:text-brand-300'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
