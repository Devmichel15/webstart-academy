import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

const questions = {
  'html-intro': [
    {
      question: 'O que HTML significa?',
      options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'HyperTransfer Markup Language'],
      correct: 0,
      explanation: 'HTML significa HyperText Markup Language — linguagem de marcação de hipertexto.',
    },
    {
      question: 'Qual é a função principal do HTML?',
      options: ['Estilizar páginas', 'Estruturar o conteúdo da web', 'Programar lógica do servidor', 'Criar animações'],
      correct: 1,
      explanation: 'HTML é responsável por estruturar e dar significado ao conteúdo da web.',
    },
  ],
  'html-structure': [
    {
      question: 'Qual elemento contém os metadados da página?',
      options: ['body', 'head', 'html', 'main'],
      correct: 1,
      explanation: 'O elemento <head> contém metadados como charset, viewport e title.',
    },
    {
      question: 'O que o DOCTYPE indica?',
      options: ['O idioma da página', 'A versão do HTML', 'O título da página', 'O charset usado'],
      correct: 1,
      explanation: 'O DOCTYPE declara a versão do HTML. No HTML5, usamos <!DOCTYPE html>.',
    },
  ],
}

export function KnowledgeCheck({ lessonId }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)

  const pool = questions[lessonId]
  if (!pool || pool.length === 0 || done) return null

  const q = pool[current]
  const isCorrect = selected === q.correct

  const handleSelect = (idx) => {
    if (revealed) return
    setSelected(idx)
  }

  const handleConfirm = () => {
    if (selected === null) return
    setRevealed(true)
  }

  const handleNext = () => {
    if (current < pool.length - 1) {
      setCurrent((c) => c + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      setDone(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-8 rounded-xl border border-brand-200 bg-white p-5 dark:border-brand-700 dark:bg-brand-900"
    >
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-400">Você entendeu?</p>
      <p className="mb-4 text-base font-semibold text-brand-800 dark:text-brand-200">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          let style = 'border-brand-200 hover:border-brand-400 dark:border-brand-700 dark:hover:border-brand-500'
          if (revealed && idx === q.correct) {
            style = 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950'
          } else if (revealed && idx === selected && idx !== q.correct) {
            style = 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950'
          } else if (selected === idx && !revealed) {
            style = 'border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-800'
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-all ${style}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                revealed && idx === q.correct
                  ? 'border-emerald-400 bg-emerald-400 text-white'
                  : revealed && idx === selected && idx !== q.correct
                  ? 'border-red-400 bg-red-400 text-white'
                  : selected === idx && !revealed
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-brand-300 text-brand-500 dark:border-brand-600'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
              {revealed && idx === q.correct && <CheckCircle2 size={16} className="ml-auto text-emerald-500" />}
              {revealed && idx === selected && idx !== q.correct && <XCircle size={16} className="ml-auto text-red-400" />}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <p className={`text-sm font-medium ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {q.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-brand-400">
          {current + 1} de {pool.length}
        </span>
        {!revealed ? (
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-40"
          >
            Confirmar
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600"
          >
            {current < pool.length - 1 ? 'Próxima' : 'Continuar'}
          </button>
        )}
      </div>
    </motion.div>
  )
}
