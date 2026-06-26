import { NavLink } from 'react-router-dom'
import {
  Award,
  Beaker,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useProgress } from '../../hooks/useProgress.js'
import { logoutUser } from '../../services/authService.js'
import { useToast } from '../../contexts/ToastContext.jsx'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trilhas', label: 'Trilhas', icon: BookOpen },
  { to: '/laboratorio', label: 'Laboratório', icon: Beaker },
  { to: '/materiais', label: 'Materiais', icon: GraduationCap },
  { to: '/perfil', label: 'Perfil', icon: Award },
]

function UserBadge() {
  const { user } = useAuth()
  const { name, photoURL, level } = useProgress()
  const { showSuccess, showError } = useToast()

  const handleLogout = async () => {
    try {
      await logoutUser()
      showSuccess('Sessão encerrada.')
    } catch (error) {
      showError(error.message)
    }
  }

  if (!user) return null

  return (
    <div className="mt-auto space-y-3 border-t-3 border-brand-200 pt-4 dark:border-brand-800">
      <div className="flex items-center gap-3 px-2">
        {photoURL ? (
          <img src={photoURL} alt={name} className="h-10 w-10 rounded-full border-2 border-brand-800 object-cover dark:border-brand-400" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-800 bg-brand-500 text-sm font-black text-white dark:border-brand-400">
            {(name || user.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{name || 'Aluno'}</p>
          <p className="text-xs font-semibold text-brand-600">Nível {level || 1}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg border-3 border-transparent px-3 py-2 text-sm font-bold text-brand-700 transition hover:border-brand-800 hover:bg-brand-50 dark:text-brand-300 dark:hover:border-brand-400 dark:hover:bg-brand-900"
      >
        <LogOut size={16} />
        Sair
      </button>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r-3 border-brand-800 bg-white p-4 text-brand-900 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-100 lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center">
          <img src="/logo.svg" alt="" />
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

      <UserBadge />
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
