import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Sparkles, Lock, ArrowRight, Globe, Link2 } from 'lucide-react'
import { trailTechConfig } from '../data/trailTechConfig'

const statusConfig = {
  available: { label: 'Disponível', color: 'text-emerald-600 dark:text-emerald-400', icon: Sparkles },
  in_progress: { label: 'Em andamento', color: 'text-blue-600 dark:text-blue-400', icon: Clock },
  completed: { label: 'Concluído', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
}

const lucideMap = {
  globe: Globe,
  link2: Link2,
}

function TechIcon({ config, size = 'normal' }) {
  if (config.deviconClass) {
    const sizeClass = size === 'compact' ? 'text-5xl' : 'text-7xl md:text-8xl'
    return (
      <i
        className={`${config.deviconClass} ${sizeClass} drop-shadow-lg`}
        aria-hidden="true"
      />
    )
  }

  if (config.useLucide) {
    const iconSize = size === 'compact' ? 48 : 72
    const Icon = lucideMap[config.useLucide]
    if (Icon) {
      return <Icon size={iconSize} strokeWidth={1.5} className="drop-shadow-lg" aria-hidden="true" />
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
      className={`trail-badge-card group relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
        isLocked
          ? 'border-border bg-surface'
          : 'border-transparent hover-lift cursor-pointer'
      }`}
      style={{
        boxShadow: isLocked ? 'none' : `4px 4px 0 0 ${activeColor}44`,
      }}
    >
      {/* Logo area - solid brand color */}
      <div
        className={`relative flex items-center justify-center overflow-hidden ${
          compact ? 'h-24' : 'h-32 sm:h-40'
        }`}
        style={{
          backgroundColor: isLocked ? '#374151' : activeColor,
        }}
      >
        {/* Icon */}
        <div
          className={`flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
            config.textDark && !isLocked ? 'text-gray-900' : 'text-white'
          }`}
        >
          <TechIcon config={config} size={compact ? 'compact' : 'normal'} />
        </div>

        {/* Badge */}
        {config.badge && !isLocked && (
          <span className="absolute top-2 right-2 rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {config.badge}
          </span>
        )}

        {/* Lock overlay for "soon" trails */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-1">
              <Lock size={compact ? 20 : 28} className="text-white/80" />
              {!compact && (
                <span className="text-xs font-bold text-white/70">Em breve</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info footer - outside colored block */}
      <div className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} bg-surface`}>
        <h3
          className={`font-black leading-tight ${
            compact ? 'text-xs' : 'text-sm'
          } ${isLocked ? 'text-muted' : 'text-primary'}`}
        >
          {trail.title}
        </h3>

        {!isLocked && (
          <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold ${cfg.color}`}>
            <StatusIcon size={10} />
            {cfg.label}
          </div>
        )}

        {!isLocked && totalLessons > 0 && (
          <div className="mt-2">
            {compact ? (
              <span className="text-[10px] font-bold text-secondary">
                {completedLessons}/{totalLessons} aulas
              </span>
            ) : (
              <>
                <div className="flex items-center justify-between text-[10px] font-bold text-secondary">
                  <span>{completedLessons}/{totalLessons} aulas</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
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

        {!isLocked && !compact && status !== 'completed' && trail.status === 'available' && (
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-accent">
            {status === 'in_progress' ? 'Continuar' : 'Explorar'}
            <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        )}

        {!isLocked && !compact && status === 'completed' && (
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400">
            <CheckCircle2 size={10} />
            Ver conclusão
          </div>
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
