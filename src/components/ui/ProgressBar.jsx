export function ProgressBar({ value = 0, label, className = '' }) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div className={className}>
      {label && (
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span>{label}</span>
          <span>{safeValue}%</span>
        </div>
      )}
      <div className="h-4 overflow-hidden rounded-full border-2 border-brand-800 bg-white dark:border-brand-400 dark:bg-brand-950">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}
