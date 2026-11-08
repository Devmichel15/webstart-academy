import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const activeErrors = useRef(new Set())

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'info') => {
      if (type === 'error') {
        if (activeErrors.current.has(message)) return
        activeErrors.current.add(message)
      }

      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, message, type }])

      setTimeout(() => {
        removeToast(id)
        if (type === 'error') activeErrors.current.delete(message)
      }, 4000)
    },
    [removeToast],
  )
  const showSuccess = useCallback(
    (message) => showToast(message, 'success'),
    [showToast],
  )
  const showError = useCallback(
    (message) => showToast(message, 'error'),
    [showToast],
  )
  const showInfo = useCallback(
    (message) => showToast(message, 'info'),
    [showToast],
  )

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      showSuccess,
      showError,
      showInfo,
      removeToast,
    }),
    [toasts, showToast, showSuccess, showError, showInfo, removeToast],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
