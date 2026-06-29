import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { Button } from '../ui/Button'
import { CodeLab } from '../lab/CodeLab'
import { ShareButtons } from '../share/ShareButtons'
import { useProgress } from '../../hooks/useProgress'

export function ExerciseBlock({ exercise, onComplete }) {
  const [showHint, setShowHint] = useState(false)
  const [done, setDone] = useState(false)
  const [shareData, setShareData] = useState(null)
  const { completeExercise, name, level, streak } = useProgress()

  if (!exercise) return null

  const handleComplete = async () => {
    setDone(true)
    const title = exercise.title || exercise.prompt?.slice(0, 60) || 'Exercício Prático'
    const result = await completeExercise(title)
    if (result?.shareData) {
      setShareData(result.shareData)
    } else {
      setShareData({
        name: name || 'Aluno',
        title: `Exercício: ${title}`,
        xpEarned: 120,
        streak,
        level,
        badge: 'Estruturador de Conteúdo',
        tagline: 'Aprendendo a estruturar a Web como um dev real',
      })
    }
    onComplete?.()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-3 border-strong bg-surface p-5">
        <h3 className="mb-2 text-lg font-black">Exercício Prático</h3>
        <p className="text-reading">{exercise.prompt}</p>
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
              Marcar como feito (+120 XP)
            </Button>
          )}
          {done && <span className="self-center text-sm font-bold text-brand-600">Exercício concluído!</span>}
        </div>

        {done && shareData && (
          <div className="mt-4 border-t-2 border pt-4">
            <p className="mb-2 text-sm font-bold text-secondary">Partilhar conquista</p>
            <ShareButtons shareData={shareData} />
          </div>
        )}
      </div>

      <CodeLab
        initialHtml={exercise.starterCode?.includes('<') ? exercise.starterCode : '<!-- Escreva seu HTML -->\n<div></div>'}
        initialCss={exercise.starterCode?.includes('<') ? '' : exercise.starterCode || ''}
        compact
      />
    </div>
  )
}
