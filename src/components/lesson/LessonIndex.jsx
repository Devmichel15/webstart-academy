import { useEffect, useState } from 'react'
import { useLesson } from '../../contexts/LessonContext'
import { motion } from 'framer-motion'

const sectionIcons = {
  introduction: '📖',
  objectives: '🎯',
  prerequisites: '📋',
  history: '📖',
  concept: '🧠',
  howItWorks: '⚙',
  realWorldApplications: '💼',
  bestPractices: '✅',
  commonMistakes: '🚫',
  deepDive: '🔬',
  curiosities: '💡',
  example: '💻',
  playground: '🧪',
  challenge: '🏆',
  exercise: '📝',
  lab: '🔬',
  quiz: '❓',
  summary: '📦',
  checklist: '✔',
  nextLesson: '👉',
}

const sectionLabels = {
  introduction: 'Introdução',
  objectives: 'Objetivos',
  prerequisites: 'Pré-requisitos',
  history: 'História',
  concept: 'Conceito',
  howItWorks: 'Como Funciona',
  realWorldApplications: 'Aplicações',
  bestPractices: 'Boas Práticas',
  commonMistakes: 'Erros Comuns',
  deepDive: 'Aprofundamento',
  curiosities: 'Curiosidades',
  example: 'Exemplo',
  playground: 'Playground',
  challenge: 'Desafio',
  exercise: 'Exercício',
  lab: 'Laboratório',
  quiz: 'Quiz',
  summary: 'Resumo',
  checklist: 'Checklist',
  nextLesson: 'Próxima Aula',
}

export function LessonIndex({ sections }) {
  const { activeSection, completedSections, setActiveSection } = useLesson()
  const [open, setOpen] = useState(false)

  const handleClick = (id) => {
    setActiveSection(id)
    const el = document.getElementById(`section-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setOpen(false)
  }

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const nav = (
    <nav className="space-y-0.5">
      {sections.map((sec) => {
        const isActive = activeSection === sec.id
        const isCompleted = completedSections.has(sec.id)
        return (
          <button
            key={sec.id}
            onClick={() => handleClick(sec.id)}
            className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-all ${
              isActive
                ? 'bg-surface-hover text-primary'
                : 'text-muted hover:bg-surface-hover hover:text-secondary'
            }`}
          >
            <span className={`shrink-0 text-[11px] leading-none ${
              isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
            }`}>
              {sectionIcons[sec.id] || '•'}
            </span>
            <span className="truncate">{sectionLabels[sec.id] || sec.title}</span>
            {isCompleted && (
              <span className="ml-auto text-muted">✓</span>
            )}
            {isActive && (
              <motion.span
                layoutId="index-dot"
                className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
              />
            )}
          </button>
        )
      })}
    </nav>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border bg-surface shadow-lg lg:hidden"
        aria-label="Índice da aula"
      >
        <span className="text-lg">📑</span>
      </button>

      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="fixed top-14 w-56 overflow-y-auto py-6" style={{ maxHeight: 'calc(100vh - 56px)' }}>
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-muted">
            Nesta aula
          </p>
          {nav}
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-72 bg-surface p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">
                Nesta aula
              </p>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-secondary">
                ✕
              </button>
            </div>
            {nav}
          </motion.div>
        </div>
      )}
    </>
  )
}
