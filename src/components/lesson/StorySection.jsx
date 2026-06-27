import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLesson } from '../../contexts/LessonContext'
import { SectionHeader } from './sections/SectionHeader'

export function StorySection({ id, title, icon, children, className = '' }) {
  const { registerSection, markCompleted } = useLesson()
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
          markCompleted(id)
          hasMarked.current = true
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [id, markCompleted])

  return (
    <motion.section
      ref={ref}
      id={`section-${id}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px 0px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`reading-level-1 ${className}`}
    >
      <SectionHeader type={id} title={title} icon={icon} />
      <div className="reading-content">
        {children}
      </div>
    </motion.section>
  )
}
