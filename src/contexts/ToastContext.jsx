import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message, type }])

    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      showSuccess: (message) => showToast(message, 'success'),
      showError: (message) => showToast(message, 'error'),
      showInfo: (message) => showToast(message, 'info'),
      removeToast,
    }),
    [toasts, showToast, removeToast],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
