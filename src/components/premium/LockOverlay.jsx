import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LockOverlay({ courseId, children }) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/60 p-6 backdrop-blur-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-3 border-brand-500 bg-brand-500/20">
          <Lock size={28} className="text-brand-500" />
        </div>
        <p className="text-center text-sm font-bold text-white">
          Conteúdo exclusivo para alunos que desbloquearam esta trilha.
        </p>
        <Link
          to={`/trilhas/${courseId}`}
          className="inline-flex items-center gap-2 rounded-xl border-3 border-brand-800 bg-brand-500 px-5 py-2 text-sm font-black text-white shadow-[3px_3px_0_0_#064e3b] transition hover:bg-brand-600 dark:shadow-[3px_3px_0_0_#34d399]"
        >
          Ver planos
        </Link>
      </div>
    </div>
  )
}
