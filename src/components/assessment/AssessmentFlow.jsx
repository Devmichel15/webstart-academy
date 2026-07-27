import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { QUESTIONS } from './AssessmentQuestionsData.js'
import { AssessmentProgressBar } from './AssessmentProgressBar.jsx'
import { AssessmentQuestionCard } from './AssessmentQuestionCard.jsx'

export function AssessmentFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward

  const question = QUESTIONS[currentStep]

  const handleSelectOption = (value) => {
    const updated = { ...answers, [question.id]: value }
    setAnswers(updated)

    if (currentStep < QUESTIONS.length - 1) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
    } else {
      onComplete(updated)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? 80 : -80,
      opacity: 0,
    }),
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between px-4 py-6 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 overflow-hidden select-none">
      {/* Shared background glow — same as intro */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar — constrained to same max-w as content */}
      <header className="relative z-10 w-full max-w-lg flex items-center gap-4 pt-2">
        <div className="w-10 shrink-0">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="p-2 rounded-xl bg-elevated border border-strong text-muted hover:text-primary hover:border-border-strong transition-all cursor-pointer"
              title="Voltar pergunta"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1">
          <AssessmentProgressBar currentStep={currentStep} totalSteps={QUESTIONS.length} />
        </div>

        <div className="w-10 shrink-0" />
      </header>

      {/* Main content — same max-w-lg as intro card */}
      <main className="relative z-10 flex-1 w-full max-w-lg flex items-center justify-center my-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={question.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="w-full"
          >
            <AssessmentQuestionCard
              question={question}
              selectedValue={answers[question.id]}
              onSelect={handleSelectOption}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer — same width as content */}
      <footer className="relative z-10 w-full max-w-lg text-center text-xs text-muted pb-2 font-medium">
        <span>Toque na opção desejada para avançar</span>
      </footer>
    </div>
  )
}
