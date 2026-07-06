import { Link, NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3, ArrowLeft } from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Utilizadores', icon: Users },
  { to: '/admin/analytics', label: 'Análises', icon: BarChart3 },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-primary">
              Painel Administrativo
            </h1>
            <p className="mt-1 text-sm text-secondary">WebStart Academy</p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg border-3 border-strong bg-surface px-4 py-2 text-sm font-bold text-primary transition hover:bg-surface-hover"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>

        <nav className="mb-8 flex gap-2 overflow-x-auto border-b-3 border-strong pb-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-bold transition ${
                  isActive
                    ? 'border-3 border-b-0 border-strong bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'text-secondary hover:bg-surface-hover'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </div>
  )
}
