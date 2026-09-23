import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Loader2, Send, Sparkles, Code, HelpCircle, BookOpen } from 'lucide-react'
import { callAI } from '../../services/aiService'
import { AIFeedbackCard } from './AIFeedbackCard'
import { toUserMessage } from '../../utils/errors.js'

const MODES = [
  { id: 'exercise_check', label: 'Corrigir', icon: Code },
  { id: 'question', label: 'Dúvida', icon: HelpCircle },
  { id: 'explain', label: 'Explicar', icon: BookOpen },
]

export function AITutor({ lessonContext, initialCode, onInsertCode }) {
  const [mode, setMode] = useState('exercise_check')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleSubmit = useCallback(async () => {
    const userAnswer = mode === 'exercise_check' ? (input || initialCode) : input
    const exercisePrompt = mode === 'explain' ? input : ''

    if (!userAnswer && mode !== 'exercise_check') {
      setError('Escreve a tua pergunta ou código primeiro.')
      return
    }
    if (!userAnswer && mode === 'exercise_check') {
      setError('Nenhum código para analisar. Escreve ou usa o editor.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await callAI({
        type: mode,
        userAnswer,
        lessonContext,
        exercisePrompt,
      })
      setResult(res)
    } catch (err) {
      setError(toUserMessage(err, 'Erro ao contactar a IA. Tenta novamente.'))
    } finally {
      setLoading(false)
    }
  }, [mode, input, initialCode, lessonContext])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-brand-500" />
        <h3 className="text-base font-black">Tutor AI</h3>
      </div>

      <div className="flex gap-1.5">
        {MODES.map((m) => {
          const Icon = m.icon
          return (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setResult(null); setError(null) }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                mode === m.id
                  ? 'bg-brand-600 text-white shadow-[2px_2px_0_0_#064e3b] dark:shadow-[2px_2px_0_0_#34d399]'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              <Icon size={14} />
              {m.label}
            </button>
          )
        })}
      </div>

      {mode === 'exercise_check' && (
        <p className="text-xs text-zinc-500">
          Cola o teu código HTML abaixo ou usa o que está no editor ao lado.
        </p>
      )}
      {mode === 'question' && (
        <p className="text-xs text-zinc-500">
          Faz uma pergunta sobre HTML, CSS ou JavaScript.
        </p>
      )}
      {mode === 'explain' && (
        <p className="text-xs text-zinc-500">
          Pede explicação sobre um conceito (ex: "diferença entre div e section").
        </p>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
          placeholder={
            mode === 'exercise_check'
              ? '<html>...</html> ou deixa vazio para usar o editor'
              : mode === 'question'
              ? 'Ex: Qual a diferença entre h1 e h2?'
              : 'Ex: O que é acessibilidade web?'
          }
          className="flex-1 rounded-xl border-3 border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-brand-400"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_0_#064e3b] transition-all hover:bg-brand-500 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 dark:shadow-[3px_3px_0_0_#34d399]"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? 'A analisar...' : 'Enviar'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border-3 border-brand-800 bg-brand-50 p-4 dark:border-brand-400 dark:bg-brand-950"
          >
            <div className="flex gap-1">
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-500 [animation-delay:0ms]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-500 [animation-delay:150ms]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-500 [animation-delay:300ms]" />
            </div>
            <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
              A analisar código com IA...
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border-3 border-red-400 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-600 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <AIFeedbackCard
              feedback={result.feedback}
              score={result.score}
              mistakes={result.mistakes}
              improvements={result.improvements}
              explanation={result.explanation}
              onClose={() => setResult(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && !result && !error && (
        <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-xs text-zinc-500 dark:border-zinc-700">
          <Bot size={16} className="shrink-0" />
          <span>Pergunta algo sobre HTML ou cola código para eu analisar.</span>
        </div>
      )}
    </div>
  )
}
