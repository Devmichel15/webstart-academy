import { Clock, Target, BarChart3, ListChecks } from 'lucide-react'

export function ExerciseHeader({ objective, duration, difficulty, requirements }) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      {objective && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-white p-4 dark:border-brand-700 dark:bg-brand-900">
          <Target size={18} className="mt-0.5 shrink-0 text-brand-500" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Objetivo</p>
            <p className="text-sm font-medium text-brand-800 dark:text-brand-200">{objective}</p>
          </div>
        </div>
      )}
      {duration && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-white p-4 dark:border-brand-700 dark:bg-brand-900">
          <Clock size={18} className="mt-0.5 shrink-0 text-brand-500" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Tempo estimado</p>
            <p className="text-sm font-medium text-brand-800 dark:text-brand-200">{duration} minutos</p>
          </div>
        </div>
      )}
      {difficulty && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-white p-4 dark:border-brand-700 dark:bg-brand-900">
          <BarChart3 size={18} className="mt-0.5 shrink-0 text-brand-500" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Dificuldade</p>
            <p className="text-sm font-medium capitalize text-brand-800 dark:text-brand-200">{difficulty}</p>
          </div>
        </div>
      )}
      {requirements && requirements.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-white p-4 dark:border-brand-700 dark:bg-brand-900">
          <ListChecks size={18} className="mt-0.5 shrink-0 text-brand-500" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Requisitos</p>
            <ul className="text-sm font-medium text-brand-800 dark:text-brand-200">
              {requirements.map((r, i) => (
                <li key={i} className="list-inside list-disc">{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
