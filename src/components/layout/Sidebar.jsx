import { NavLink } from 'react-router-dom'
import {
  Award,
  BarChart3,
  Beaker,
  BookOpen,
  Bot,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Shield,
  Users,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useProgress } from '../../hooks/useProgress.js'
import { useUser } from '../../hooks/useUser.js'
import { logoutUser } from '../../services/authService.js'
import { useToast } from '../../contexts/ToastContext.jsx'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

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
    <div className="mt-auto space-y-3 border-t border pt-4">
      <div className="flex items-center gap-3 px-2">
        {photoURL ? (
          <img src={photoURL} alt={name} className="h-10 w-10 rounded-full border-2 border-strong object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-strong bg-brand-500 text-sm font-black text-white">
            {(name || user.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-primary">{name || 'Aluno'}</p>
          <p className="text-xs font-semibold text-secondary">Nível {level || 1}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg border-3 border-transparent px-3 py-2 text-sm font-bold text-secondary transition hover:border-strong hover:bg-surface-hover"
      >
        <LogOut size={16} />
        Sair
      </button>
    </div>
  )
}

const baseNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trilhas', label: 'Trilhas', icon: BookOpen },
  { to: '/laboratorio', label: 'Laboratório', icon: Beaker },
  { to: '/chat', label: 'Tutor IA', icon: Bot },
  { to: '/materiais', label: 'Materiais', icon: GraduationCap },
  { to: '/perfil', label: 'Perfil', icon: Award },
]

function getAdminItems(profile, fbUser) {
  const isAdmin = profile?.role === 'admin' || fbUser?.email === ADMIN_EMAIL
  if (!isAdmin) return []
  return [
    { to: '/admin', label: 'Admin', icon: Shield },
    { to: '/admin/users', label: 'Utilizadores', icon: Users },
    { to: '/admin/analytics', label: 'Análises', icon: BarChart3 },
  ]
}

export function Sidebar() {
  const { user: fbUser } = useAuth()
  const { user: profile } = useUser()
  const adminItems = getAdminItems(profile, fbUser)
  const navItems = [...adminItems, ...baseNavItems]

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-strong bg-surface text-primary lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2 pt-4">
        <div className="flex h-10 w-10 items-center justify-center">
          <img src="/logo.svg" alt="" />
        </div>
        <div>
          <p className="text-lg font-black leading-none text-primary">WebStart</p>
          <p className="text-xs font-semibold text-secondary">Academy</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-3 px-3 py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? 'border-strong bg-brand-500 text-white shadow-[3px_3px_0_0_#064e3b] dark:shadow-[3px_3px_0_0_#34d399]'
                  : 'border-transparent text-primary hover:border-strong hover:bg-surface-hover'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-4">
        <UserBadge />
      </div>
    </aside>
  )
}

export function MobileNav() {
  const { user: fbUser } = useAuth()
  const { user: profile } = useUser()
  const adminItems = getAdminItems(profile, fbUser)
  const navItems = [...adminItems, ...baseNavItems]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t-3 border-strong bg-surface lg:hidden">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold ${
              isActive ? 'text-brand-600' : 'text-primary'
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
