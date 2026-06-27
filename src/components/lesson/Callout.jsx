export function Callout({ variant = 'info', icon, children }) {
  const styles = {
    info: 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-700 dark:bg-brand-900 dark:text-brand-200',
    tip: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200',
    error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200',
  }

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles[variant]}`}>
      {icon && <span className="mt-0.5 shrink-0 text-base leading-none">{icon}</span>}
      <div>{children}</div>
    </div>
  )
}
