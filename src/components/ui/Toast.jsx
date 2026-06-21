import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext.jsx'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const styles = {
  success: 'border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-900 dark:text-brand-100',
  error: 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
  info: 'border-brand-400 bg-white text-brand-900 dark:bg-brand-950 dark:text-brand-100',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info
        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border-3 p-4 text-left shadow-[4px_4px_0_0_#064e3b] ${styles[toast.type] || styles.info}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <span className="text-sm font-semibold">{toast.message}</span>
          </button>
        )
      })}
    </div>
  )
}
