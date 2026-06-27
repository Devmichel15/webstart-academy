export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-accent-soft text-primary dark:bg-surface-hover dark:text-primary',
    success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${variants[variant]} border-strong ${className}`}
    >
      {children}
    </span>
  )
}
