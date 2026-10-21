import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined
    const handler = (event) => {
      if (event.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !loading && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-hard border-2 border-strong bg-surface p-6 shadow-hard"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-lg font-black text-primary">{title}</h3>
        <p className="mb-6 text-sm text-secondary">{message}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="brutal-btn brutal-btn-hard rounded-lg px-4 py-2 font-bold text-primary hover:bg-surface-hover disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-bold text-white shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'brutal-btn-brand bg-brand-500 hover:bg-brand-600'
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
