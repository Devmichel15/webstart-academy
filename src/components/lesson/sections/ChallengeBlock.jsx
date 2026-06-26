import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'

export function ChallengeBlock({ challenge }) {
  const [showHint, setShowHint] = useState(false)
  const [completed, setCompleted] = useState(false)

  if (!challenge) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-4"
    >
      <Card className="!border-pink-500 dark:!border-pink-400">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-700 text-white text-xs font-bold">
            !
          </div>
          <h3 className="font-black">Desafio</h3>
        </div>
        <p className="mb-4 leading-relaxed text-brand-800 dark:text-brand-200">{challenge.prompt}</p>

        {challenge.starterCode && (
          <pre className="mb-4 overflow-x-auto rounded-lg border-2 border-brand-200 bg-brand-50 p-3 text-sm dark:border-brand-700 dark:bg-brand-900">
            <code>{challenge.starterCode}</code>
          </pre>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowHint((v) => !v)}>
            <Lightbulb size={14} />
            {showHint ? 'Ocultar dica' : 'Ver dica'}
          </Button>
          {!completed && (
            <Button size="sm" onClick={() => setCompleted(true)}>
              Resolvido!
            </Button>
          )}
          {completed && <span className="self-center text-sm font-bold text-green-600">Desafio concluído!</span>}
        </div>

        {showHint && challenge.hint && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <Lightbulb size={16} className="mt-0.5 shrink-0" />
            {challenge.hint}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
