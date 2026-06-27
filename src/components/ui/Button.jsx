const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  secondary: 'bg-surface text-primary dark:bg-surface dark:text-primary',
  ghost: 'bg-transparent shadow-none border-transparent',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      className={`brutal-btn inline-flex items-center justify-center gap-2 rounded-lg font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
