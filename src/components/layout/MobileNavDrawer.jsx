import { useEffect, useRef, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useUser } from '../../hooks/useUser.js'
import { getNavItems } from '../../data/navItems.js'
import { UserBadge } from './Sidebar.jsx'

export function MobileNavDrawer({ isOpen, onClose }) {
  const drawerRef = useRef(null)
  const previousFocusRef = useRef(null)
  const { user: fbUser } = useAuth()
  const { user: profile } = useUser()
  const navItems = getNavItems(profile, fbUser)

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'Tab' && drawerRef.current) {
      const focusable = drawerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement
      document.body.classList.add('drawer-open')

      requestAnimationFrame(() => {
        const firstFocusable = drawerRef.current?.querySelector(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        firstFocusable?.focus()
      })

      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.classList.remove('drawer-open')
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 flex w-72 flex-col border-r border-strong bg-surface shadow-xl lg:hidden"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="" className="h-8 w-8" />
                <div>
                  <p className="text-sm font-black leading-none text-primary">WebStart</p>
                  <p className="text-[10px] font-semibold text-secondary">Academy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-transparent transition hover:border-strong hover:bg-surface-hover"
                aria-label="Fechar menu"
              >
                <X size={20} className="text-primary" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
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

            <div className="px-3 pb-4">
              <UserBadge />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
