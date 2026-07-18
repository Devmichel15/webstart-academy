import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Sparkles, Lock, ArrowRight, Globe, Link2 } from 'lucide-react'
import { trailTechConfig } from '../data/trailTechConfig'

const statusConfig = {
  available: { label: 'Disponível', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', icon: Sparkles },
  in_progress: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', icon: CheckCircle2 },
}

const lucideMap = {
  globe: Globe,
  link2: Link2,
}

function TechIcon({ config, size = 'normal' }) {
  const sizeClass = size === 'compact' ? 'text-3xl' : 'text-6xl'

  if (config.deviconClass) {
    return (
      <i
        className={`${config.deviconClass} ${sizeClass}`}
        aria-hidden="true"
      />
    )
  }

  if (config.useLucide) {
    const iconSize = size === 'compact' ? 28 : 56
    const Icon = lucideMap[config.useLucide]
    if (Icon) {
      return <Icon size={iconSize} strokeWidth={1.5} aria-hidden="true" />
    }
  }

  return null
}

export function TrilhaBadgeCard({ trail, status, progress, completedLessons, totalLessons, compact = false }) {
  const config = trailTechConfig[trail.id] || {
    deviconClass: null,
    brandColor: '#10b981',
    brandColorDark: '#34d399',
    label: trail.title,
  }

  const isLocked = trail.status === 'soon'
  const cfg = statusConfig[status] || statusConfig.available
  const StatusIcon = cfg.icon
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const activeColor = isDark ? config.brandColorDark : config.brandColor

  const cardContent = (
    <div
      className={`trail-badge-card group relative overflow-hidden rounded-2xl border-3 transition-all duration-200 ${
        isLocked
          ? 'border-border bg-surface opacity-80'
          : 'border-border-strong hover-lift cursor-pointer'
      } ${compact ? 'p-0' : ''}`}
      style={{
        boxShadow: isLocked ? 'none' : `4px 4px 0 0 ${activeColor}33`,
        ['--badge-color']: activeColor,
      }}
    >
      {/* Logo area */}
      <div
        className={`trail-badge-icon-area relative flex items-center justify-center ${
          compact ? 'h-20' : 'h-28 sm:h-32'
        } ${isLocked ? 'grayscale opacity-30' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${activeColor}22, ${activeColor}11)`,
        }}
      >
        <div
          className={`flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
            config.textDark ? 'text-gray-800 dark:text-gray-800' : 'text-white'
          } ${compact ? '' : 'drop-shadow-lg'}`}
          style={{ color: isLocked ? '#9ca3af' : undefined }}
        >
          <TechIcon config={config} size={compact ? 'compact' : 'normal'} />
        </div>

        {config.badge && (
          <span className="absolute top-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {config.badge}
          </span>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Lock size={compact ? 16 : 24} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Color accent line */}
      {!isLocked && (
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${activeColor}, ${activeColor}88)` }}
        />
      )}

      {/* Info area */}
      <div className={`${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
        <h3
          className={`font-black leading-tight ${
            compact ? 'text-xs' : 'text-sm'
          } ${isLocked ? 'text-muted' : 'text-primary'}`}
        >
          {trail.title}
        </h3>

        {isLocked ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] font-semibold text-muted">
            <Lock size={10} />
            Em breve
          </span>
        ) : (
          <>
            {!compact && (
              <span className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                <StatusIcon size={10} />
                {cfg.label}
              </span>
            )}

            {totalLessons > 0 && (
              <div className={`mt-1.5 ${compact ? 'mt-1' : ''}`}>
                {compact ? (
                  <span className="text-[10px] font-bold text-secondary">
                    {completedLessons}/{totalLessons}
                  </span>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[10px] font-bold text-secondary">
                      <span>{completedLessons}/{totalLessons} aulas</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full border border-border-strong bg-surface">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: activeColor,
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {!compact && status !== 'completed' && trail.status === 'available' && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-accent">
                {status === 'in_progress' ? 'Continuar' : 'Explorar'}
                <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            )}

            {!compact && status === 'completed' && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                <CheckCircle2 size={10} />
                Ver conclusão
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {cardContent}
      </motion.div>
    )
  }

  return (
    <Link to={`/trilhas/${trail.id}`} className="block">
      {cardContent}
    </Link>
  )
}
