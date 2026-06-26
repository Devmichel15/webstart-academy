import { useState } from 'react'
import { Header } from '../components/layout/Header'
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

      <div className="mb-6 rounded-lg border border-brand-800 bg-brand-950 p-4">
        <h2 className="mb-4 text-lg font-black text-white">Desafios guiados</h2>
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
        <div className="mt-4 rounded-lg border border-brand-700 bg-brand-900 p-4">
          <p className="font-bold text-white">{activeChallenge.title}</p>
          <p className="text-sm text-brand-300">{activeChallenge.description}</p>
          <p className="mt-2 text-xs font-semibold text-amber-400">Dica: {activeChallenge.hint}</p>
        </div>
      </div>

      <CodeLab
        key={activeChallenge.id}
        initialHtml={activeChallenge.starterHtml}
        initialCss={activeChallenge.starterCss}
      />
    </div>
  )
}
