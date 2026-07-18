import {
  Award,
  BarChart3,
  Beaker,
  BookOpen,
  Bot,
  GraduationCap,
  LayoutDashboard,
  Shield,
  Users,
} from 'lucide-react'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

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

export function getNavItems(profile, fbUser) {
  const adminItems = getAdminItems(profile, fbUser)
  return [...adminItems, ...baseNavItems]
}
