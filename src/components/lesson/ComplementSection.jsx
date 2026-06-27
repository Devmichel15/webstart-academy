import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLesson } from '../../contexts/LessonContext'
import { SectionHeader } from './sections/SectionHeader'

export function ComplementSection({ id, title, icon, children, className = '' }) {
  const { registerSection } = useLesson()
  const ref = useRef(null)
  const hasMarked = useRef(false)

  useEffect(() => {
    if (id) registerSection(id)
  }, [id, registerSection])

  useEffect(() => {
    if (!ref.current || hasMarked.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasMarked.current) {
          hasMarked.current = true
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [id])

  return (
    <motion.section
      ref={ref}
      id={`section-${id}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px 0px' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`reading-level-2 ${className}`}
    >
      <SectionHeader type={id} title={title} icon={icon} compact />
      <div className="reading-content-compact">
        {children}
      </div>
    </motion.section>
  )
}
