import { useLesson } from '../../contexts/LessonContext'
import { Clock } from 'lucide-react'

export function ReadingProgress() {
  const { progress, activeSection, duration, sectionsMeta } = useLesson()

  const section = sectionsMeta?.find((s) => s.id === activeSection)

  return (
    <div className="fixed top-0 left-0 right-0 z-40 border-b border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 font-medium text-secondary">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="tabular-nums">{progress}%</span>
        </div>

        {section && (
          <span className="hidden truncate text-muted sm:block">
            {section.icon} {section.title}
          </span>
        )}

        {duration && (
          <span className="ml-auto flex items-center gap-1 text-muted">
            <Clock size={12} />
            {duration} min
          </span>
        )}
      </div>
    </div>
  )
}
