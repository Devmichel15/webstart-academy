import { useState } from 'react'
import { ArrowRight, ExternalLink, Loader2 } from 'lucide-react'

export function PremiumCTA({ formUrl, courseTitle }) {
  const [showMessage, setShowMessage] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const handleClick = () => {
    setShowMessage(true)
  }

  const handleConfirm = () => {
    setRedirecting(true)
    window.open(formUrl, '_blank', 'noopener,noreferrer')
    setTimeout(() => setRedirecting(false), 2000)
  }

  const handleCancel = () => {
    setShowMessage(false)
  }

  if (showMessage) {
    return (
      <div className="rounded-2xl border-3 border-brand-800 bg-gradient-to-br from-brand-500/10 to-brand-700/5 p-6 text-center dark:border-brand-400">
        <p className="mb-4 text-sm font-bold leading-relaxed text-primary">
          Serás redirecionado para o formulário de pagamento.
          <br />
          Após o envio, a tua conta será analisada e o acesso
          será desbloqueado em até 24 horas.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleCancel}
            className="rounded-xl border-2 border-strong bg-surface px-5 py-2.5 text-sm font-bold text-secondary transition hover:bg-surface-hover"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={redirecting}
            className="inline-flex items-center gap-2 rounded-xl border-3 border-brand-800 bg-brand-500 px-6 py-2.5 text-sm font-black text-white shadow-[3px_3px_0_0_#064e3b] transition hover:bg-brand-600 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60 dark:shadow-[3px_3px_0_0_#34d399]"
          >
            {redirecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ExternalLink size={16} />
            )}
            Continuar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl border-3 border-brand-800 bg-brand-500 px-8 py-4 text-base font-black text-white shadow-[5px_5px_0_0_#064e3b] transition-all hover:bg-brand-600 active:translate-x-[5px] active:translate-y-[5px] active:shadow-none dark:shadow-[5px_5px_0_0_#34d399] sm:w-auto sm:text-lg"
    >
      Desbloquear Trilha
      <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
    </button>
  )
}
