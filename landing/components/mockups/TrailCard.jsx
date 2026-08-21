import { Link2, ArrowRight, Lock, Sparkles, Code2 } from 'lucide-react'
import { Reveal } from '../Reveal'

export function TrailCard({ trail, index }) {
  const available = trail.status === 'available'

  return (
    <Reveal delay={Math.min(index * 0.05, 0.4)} y={20}>
      {available ? (
        <a href="/registro" className="trail-badge-card-hover group block overflow-hidden rounded-2xl border-2 border-transparent bg-surface shadow-[4px_4px_0_0_rgba(52,211,153,0.27)] hover-lift">
          <TrailBody trail={trail} available />
        </a>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-border bg-surface">
          <TrailBody trail={trail} available={false} />
        </div>
      )}
    </Reveal>
  )
}

function TrailBody({ trail, available }) {
  return (
    <>
      <div
        className="relative flex h-24 items-center justify-center sm:h-28"
        style={{ backgroundColor: available ? trail.color : '#374151' }}
        aria-hidden="true"
      >
        {available ? (
          <span className={`transition-transform duration-300 group-hover:scale-110 ${trail.textDark ? 'text-gray-900' : 'text-white'}`}>
            {trail.devicon ? (
              <i className={`${trail.devicon} text-5xl drop-shadow-lg`} />
            ) : trail.lucideIcon === 'link' ? (
              <Link2 size={44} strokeWidth={1.5} className="drop-shadow-lg" />
            ) : (
              <Code2 size={44} strokeWidth={1.5} className="drop-shadow-lg" />
            )}
          </span>
        ) : (
          <span className={`opacity-40 ${trail.textDark ? 'text-gray-900' : 'text-white'}`}>
            {trail.devicon ? (
              <i className={`${trail.devicon} text-5xl`} />
            ) : trail.lucideIcon === 'link' ? (
              <Link2 size={44} strokeWidth={1.5} />
            ) : (
              <Code2 size={44} strokeWidth={1.5} />
            )}
          </span>
        )}

        {trail.badge && available && (
          <span className="absolute right-2 top-2 rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {trail.badge}
          </span>
        )}

        {!available && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Lock size={22} className="text-white/80" aria-hidden="true" />
            <span className="text-xs font-bold text-white/70">Em breve</span>
          </div>
        )}
      </div>

      <div className="px-3 py-3 sm:px-4">
        <h3 className={`truncate text-sm font-black leading-tight ${available ? 'text-primary' : 'text-muted'}`}>
          {trail.title}
        </h3>
        {available ? (
          <>
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-brand-400">
              <Sparkles size={11} aria-hidden="true" /> Disponível
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-accent">
              Explorar
              <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </p>
          </>
        ) : (
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-muted">
            <Lock size={11} aria-hidden="true" /> Em construção
          </p>
        )}
      </div>
    </>
  )
}
