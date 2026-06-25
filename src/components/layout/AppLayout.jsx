import { Outlet } from 'react-router-dom'
import { MobileNav, Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-brand-50 text-brand-900 dark:bg-brand-950 dark:text-brand-100">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
