import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { MobileNavDrawer } from './MobileNavDrawer'
import { IncompleteProfileDrawer } from '../profile/IncompleteProfileDrawer'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleMenuToggle = useCallback(() => setMenuOpen((v) => !v), [])
  const handleMenuClose = useCallback(() => setMenuOpen(false), [])

  return (
    <div className="flex min-h-screen bg-canvas text-primary">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader onMenuToggle={handleMenuToggle} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 pt-28 md:p-8 md:pt-28 lg:pt-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNavDrawer isOpen={menuOpen} onClose={handleMenuClose} />
      <IncompleteProfileDrawer />
    </div>
  )
}
