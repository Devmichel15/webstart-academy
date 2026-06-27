export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`brutal-card rounded-xl p-5 ${hover ? 'hover-lift' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
