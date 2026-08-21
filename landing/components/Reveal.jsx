import { motion, useReducedMotion } from 'framer-motion'

export function Reveal({ children, delay = 0, y = 28, once = true, className = '', as = 'div' }) {
  const reduced = useReducedMotion()
  const MotionTag = motion[as] || motion.div

  if (reduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-64px' }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </MotionTag>
  )
}

export function SectionHeader({ eyebrow, title, children, align = 'center', id }) {
  const alignment = align === 'left' ? 'items-start text-left' : 'items-center text-center'
  return (
    <Reveal className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow && (
        <p className="font-mono text-sm font-semibold tracking-wider text-accent" aria-hidden="true">
          {'//'} {eyebrow}
        </p>
      )}
      <h2 id={id} className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {children && <div className="max-w-2xl text-base leading-relaxed text-secondary sm:text-lg">{children}</div>}
    </Reveal>
  )
}
