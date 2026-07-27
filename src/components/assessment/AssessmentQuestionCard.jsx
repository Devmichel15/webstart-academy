import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'

export function AssessmentQuestionCard({ question, selectedValue, onSelect }) {
  const [activeValue, setActiveValue] = useState(selectedValue || null)
  const [showMicrocopy, setShowMicrocopy] = useState(false)

  const handleCardClick = (val) => {
    if (showMicrocopy) return
    setActiveValue(val)
    setShowMicrocopy(true)

    setTimeout(() => {
      onSelect(val)
      setShowMicrocopy(false)
    }, 850)
  }

  const microtext = activeValue ? question.getMicrocopy(activeValue) : ''

  return (
    <div className="w-full flex flex-col items-center">
      {/* Question Header */}
      <div className="w-full text-center mb-7">
        <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight mb-2 leading-snug">
          {question.title}
        </h2>
        {question.subtext && (
          <p className="text-sm sm:text-base text-secondary font-medium max-w-md mx-auto">
            {question.subtext}
          </p>
        )}
      </div>

      {/* Options Grid — brutal-card style per option */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {question.options.map((option) => {
          const isSelected = activeValue === option.value
          const IconComponent = Icons[option.icon] || Icons.CheckCircle

          return (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97, y: 0 }}
              onClick={() => handleCardClick(option.value)}
              className={`relative text-left p-4 rounded-xl border-3 transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                isSelected
                  ? 'bg-accent-soft border-accent shadow-brutal text-primary'
                  : 'brutal-card hover:bg-surface-hover hover:-translate-x-px hover:-translate-y-px hover:shadow-brutal text-primary'
              }`}
            >
              {/* Icon badge */}
              <div
                className={`p-2 rounded-lg transition-colors shrink-0 mt-0.5 ${
                  isSelected
                    ? 'bg-accent text-white'
                    : 'bg-elevated text-muted'
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="flex-1 pr-1">
                <span className="text-sm sm:text-base font-bold leading-snug block text-primary">
                  {option.label}
                </span>
              </div>

              {/* Selected indicator dot */}
              {isSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-1.5" />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Microcopy Feedback */}
      <div className="h-10 w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showMicrocopy && microtext && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-2 rounded-xl bg-accent-soft border border-accent/30 text-secondary text-xs sm:text-sm font-semibold text-center"
            >
              {microtext}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
