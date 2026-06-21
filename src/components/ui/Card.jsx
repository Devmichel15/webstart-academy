export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`brutal-card rounded-xl p-5 ${hover ? 'transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
