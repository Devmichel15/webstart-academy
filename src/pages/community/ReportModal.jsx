import { useState } from 'react'
import { Flag, Loader2, X } from 'lucide-react'
import { createPostReport } from '../../services/communityService.js'
import { useToast } from '../../contexts/ToastContext.jsx'

export function ReportModal({ open, projectId = null, commentId = null, onClose, onReported }) {
  const { showError } = useToast()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await createPostReport({
        projectId,
        commentId,
        reason,
      })
      setReason('')
      onReported?.()
    } catch (err) {
      showError(err.message || 'Não foi possível enviar a denúncia.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onClick={() => !submitting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Denunciar conteúdo"
    >
      <div
        className="my-8 w-full max-w-md rounded-xl border-3 border-strong bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-primary">
            <Flag size={18} className="text-red-500" /> Denunciar conteúdo
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg p-1 text-secondary hover:bg-surface-hover hover:text-primary disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm text-secondary">
          Explica o motivo em poucas palavras. A equipa da WebStart Academy vai avaliar e agir.
        </p>

        <textarea
          rows={4}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: conteúdo ofensivo, spam, link suspeito..."
          className="w-full rounded-lg border-3 border-brand-800 bg-white px-3 py-2 text-sm text-black dark:border-brand-400 dark:bg-brand-950 dark:text-primary"
        />
        <div className="mt-1 text-right text-xs text-secondary">
          {reason.length}/500
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg border-2 border-strong px-4 py-2 font-bold text-primary hover:bg-surface-hover disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting || reason.trim().length < 3}
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-bold text-white cursor-pointer hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Enviar denúncia
          </button>
        </div>
      </div>
    </div>
  )
}