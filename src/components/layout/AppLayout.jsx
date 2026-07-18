import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { MobileNavDrawer } from './MobileNavDrawer'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleMenuToggle = useCallback(() => setMenuOpen((v) => !v), [])
  const handleMenuClose = useCallback(() => setMenuOpen(false), [])

  return (
    <div className="flex min-h-screen bg-canvas text-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <MobileHeader onMenuToggle={handleMenuToggle} />
        <main className="flex-1 overflow-y-auto p-4 pt-[5.5rem] md:p-8 lg:pt-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNavDrawer isOpen={menuOpen} onClose={handleMenuClose} />
    </div>
  )
}
