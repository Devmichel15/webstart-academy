export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border-2 border-brand-800 px-2 py-0.5 text-xs font-bold uppercase tracking-wide dark:border-brand-400 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
