import { useNavigate } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'

export function AssessmentBanner() {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden w-full bg-gradient-to-r from-brand-950/80 via-slate-900 to-emerald-950/50 border border-brand-500/30 rounded-2xl p-4 sm:p-5 shadow-lg mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Background glow */}
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start sm:items-center gap-3.5 relative z-10">
        <div className="p-2.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
            Ainda não te conhecemos direito!
          </h4>
          <p className="text-xs sm:text-sm text-slate-300">
            Responda 7 perguntas rápidas para montarmos o plano de estudos ideal pro seu ritmo.
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/avaliacao-perfil')}
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.25)] transition-all cursor-pointer w-full sm:w-auto justify-center"
      >
        <span>Criar meu plano</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
