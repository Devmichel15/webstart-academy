import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { Button } from '../ui/Button'
import { CodeLab } from '../lab/CodeLab'

export function ExerciseBlock({ exercise, onComplete }) {
  const [showHint, setShowHint] = useState(false)
  const [done, setDone] = useState(false)

  if (!exercise) return null

  const handleComplete = () => {
    setDone(true)
    onComplete?.()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-3 border-brand-800 bg-brand-50 p-5 dark:border-brand-400 dark:bg-brand-950">
        <h3 className="mb-2 text-lg font-black">Exercício Prático</h3>
        <p className="text-brand-800 dark:text-brand-200">{exercise.prompt}</p>
        {showHint && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <Lightbulb size={18} className="mt-0.5 shrink-0" />
            {exercise.hint}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowHint((value) => !value)}>
            {showHint ? 'Ocultar dica' : 'Ver dica'}
          </Button>
          {!done && (
            <Button size="sm" onClick={handleComplete}>
              Marcar como feito
            </Button>
          )}
          {done && <span className="self-center text-sm font-bold text-brand-600">Exercício concluído!</span>}
        </div>
      </div>

      <CodeLab
        initialHtml={exercise.starterCode?.includes('<') ? exercise.starterCode : '<!-- Escreva seu HTML -->\n<div></div>'}
        initialCss={exercise.starterCode?.includes('<') ? '' : exercise.starterCode || ''}
        compact
      />
    </div>
  )
}
