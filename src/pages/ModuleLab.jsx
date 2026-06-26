import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { CodeLab } from '../components/lab/CodeLab'
import { getModuleData } from '../data/roadmaps.js'

export default function ModuleLab() {
  const { courseId, moduleId } = useParams()
  const mod = getModuleData(moduleId)

  if (!mod || !mod.lab) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Laboratório não encontrado</h1>
        <Link to={`/trilhas/${courseId}/modulo/${moduleId}`} className="mt-4 inline-block font-bold text-brand-600 underline">
          Voltar ao módulo
        </Link>
      </div>
    )
  }

  const { lab } = mod

  return (
    <div>
      <Link to={`/trilhas/${courseId}/modulo/${moduleId}`} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
        <ArrowLeft size={16} />
        Voltar para {mod.title}
      </Link>

      <Header title={lab.title} subtitle={lab.description} />

      <Card className="mb-6">
        <div className="mb-4">
          <Badge>Contexto</Badge>
          <p className="mt-3 leading-relaxed text-brand-800 dark:text-brand-200">{lab.context}</p>
        </div>

        {lab.hint && (
          <div className="mb-4 rounded-lg border-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-bold">Dica:</p>
            <p>{lab.hint}</p>
          </div>
        )}

        {lab.checklist && lab.checklist.length > 0 && (
          <div>
            <h3 className="mb-2 font-bold">Checklist do Laboratório</h3>
            <ul className="space-y-1">
              {lab.checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <CodeLab initialHtml={lab.starterHtml} initialCss={lab.starterCss} />
      </Card>
    </div>
  )
}
