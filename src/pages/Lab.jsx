import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { CodeLab } from '../components/lab/CodeLab'
import { labChallenges } from '../data/materials'
import { Button } from '../components/ui/Button'

export default function Lab() {
  const [activeChallenge, setActiveChallenge] = useState(labChallenges[0])

  return (
    <div>
      <Header
        title="Laboratório"
        subtitle="Editor HTML/CSS integrado com preview em tempo real."
      />

      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-black">Desafios guiados</h2>
        <div className="flex flex-wrap gap-2">
          {labChallenges.map((challenge) => (
            <Button
              key={challenge.id}
              variant={activeChallenge.id === challenge.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveChallenge(challenge)}
            >
              {challenge.title}
            </Button>
          ))}
        </div>
        <div className="mt-4 rounded-lg border-2 border-brand-200 bg-brand-50 p-4 dark:border-brand-700 dark:bg-brand-900">
          <p className="font-bold">{activeChallenge.title}</p>
          <p className="text-sm text-brand-700 dark:text-brand-300">{activeChallenge.description}</p>
          <p className="mt-2 text-xs font-semibold text-brand-600">Dica: {activeChallenge.hint}</p>
        </div>
      </Card>

      <Card>
        <CodeLab
          key={activeChallenge.id}
          initialHtml={activeChallenge.starterHtml}
          initialCss={activeChallenge.starterCss}
        />
      </Card>
    </div>
  )
}
