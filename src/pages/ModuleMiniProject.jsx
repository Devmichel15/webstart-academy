import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CodeLab } from '../components/lab/CodeLab'
import { ShareButtons } from '../components/share/ShareButtons'
import { getModuleData } from '../data/trails.js'
import { useProgress } from '../hooks/useProgress.js'
import { useState } from 'react'

export default function ModuleMiniProject() {
  const { courseId, moduleId } = useParams()
  const mod = getModuleData(moduleId)
  const [showRubric, setShowRubric] = useState(false)
  const [done, setDone] = useState(false)
  const [shareData, setShareData] = useState(null)
  const { completeProject } = useProgress()

  if (!mod || !mod.miniProject) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Mini Projeto não encontrado</h1>
        <Link to={`/trilhas/${courseId}/modulo/${moduleId}`} className="mt-4 inline-block font-bold text-brand-600 underline">
          Voltar ao módulo
        </Link>
      </div>
    )
  }

  const project = mod.miniProject

  const handleComplete = async () => {
    setDone(true)
    const result = await completeProject(project.title)
    if (result?.shareData) setShareData(result.shareData)
  }

  return (
    <div>
      <Link to={`/trilhas/${courseId}/modulo/${moduleId}`} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
        <ArrowLeft size={16} />
        Voltar para {mod.title}
      </Link>

      <Header title={project.title} subtitle={project.description} />

      <Card className="mb-6">
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-600">Contexto</h3>
          <p className="leading-relaxed text-brand-800 dark:text-brand-200">{project.context}</p>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-600">Requisitos</h3>
          <ul className="space-y-2">
            {project.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-500" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {project.hint && (
          <div className="mb-4 rounded-lg border-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-bold">Dica:</p>
            <p>{project.hint}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowRubric((v) => !v)}>
            {showRubric ? 'Ocultar' : 'Ver'} critérios de avaliação
          </Button>
          {!done && (
            <Button size="sm" onClick={handleComplete}>
              Concluir projeto (+300 XP)
            </Button>
          )}
          {done && <span className="self-center text-sm font-bold text-brand-600">Projeto concluído!</span>}
        </div>

        {showRubric && project.rubric && (
          <div className="mt-4 rounded-lg border-2 border-purple-500 bg-purple-50 p-4 dark:bg-purple-950">
            <h4 className="mb-2 font-bold text-purple-900 dark:text-purple-200">Critérios de Avaliação</h4>
            <ul className="space-y-1">
              {project.rubric.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {done && shareData && (
          <div className="mt-4 border-t-2 border pt-4">
            <p className="mb-2 text-sm font-bold text-secondary">Partilhar projeto</p>
            <ShareButtons shareData={shareData} />
          </div>
        )}
      </Card>

      <Card>
        <CodeLab initialHtml={project.starterHtml} initialCss={project.starterCss} />
      </Card>
    </div>
  )
}
