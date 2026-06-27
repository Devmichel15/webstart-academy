import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const LessonContext = createContext(null)

export function LessonProvider({ children, sections, sectionsMeta, duration }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')
  const [completedSections, setCompletedSections] = useState(new Set())
  const [totalSections] = useState(sections.length)
  const sectionRefs = useRef({})

  const registerSection = useCallback((id) => {
    sectionRefs.current[id] = true
  }, [])

  const markCompleted = useCallback((id) => {
    setCompletedSections((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const ra = Math.abs(a.boundingClientRect.top)
            const rb = Math.abs(b.boundingClientRect.top)
            return ra - rb
          })
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id.replace('section-', ''))
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    const current = sectionRefs.current
    Object.keys(current).forEach((id) => {
      const el = document.getElementById(`section-${id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const progress = totalSections > 0
    ? Math.round((completedSections.size / totalSections) * 100)
    : 0

  const value = useMemo(
    () => ({
      activeSection,
      completedSections,
      progress,
      totalSections,
      duration,
      sectionsMeta: sectionsMeta || [],
      registerSection,
      markCompleted,
      setActiveSection,
    }),
    [activeSection, completedSections, progress, totalSections, duration, sectionsMeta, registerSection, markCompleted]
  )

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLesson() {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson must be used within LessonProvider')
  return ctx
}
