import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Award, Target } from 'lucide-react'
import { SEO } from '../components/seo/SEO'
import { getModuleData } from '../data/trails.js'
import { CodeLab } from '../components/lab/CodeLab'
import { XP_LAB } from '../utils/xp.js'

export default function ModuleLab() {
  const { courseId, moduleId } = useParams()
  const mod = getModuleData(moduleId)

  if (!mod || !mod.lab) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black">Laboratório não encontrado</h1>
          <Link to={`/trilhas/${courseId}/modulo/${moduleId}`} className="mt-4 inline-block font-bold text-brand-600 underline">
            Voltar ao módulo
          </Link>
        </div>
      </div>
    )
  }

  const { lab } = mod

  return (
    <>
    <SEO title={mod ? `Laboratório: ${mod.title}` : 'Laboratório'} description={`Pratique ${mod ? mod.title : 'desenvolvimento web'} com exercícios interativos de código.`} url={`/trilhas/${courseId}/modulo/${moduleId}/lab`} />
    <div className="space-y-4">
      {/* Back link */}
      <Link to={`/trilhas/${courseId}/modulo/${moduleId}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
        <ArrowLeft size={16} />
        Voltar para {mod.title}
      </Link>

      {/* Top bar with lab info */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-800 bg-brand-950 px-5 py-3">
        <div>
          <h1 className="text-lg font-black text-white">{lab.title}</h1>
          <p className="text-sm text-brand-300">{mod.title} • Laboratório</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-brand-300">
            <Target size={14} />
            {lab.description}
          </span>
          <span className="flex items-center gap-1.5 text-brand-300">
            <Clock size={14} />
            ~15 min
          </span>
          <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
            <Award size={14} />
            +{XP_LAB || 50} XP
          </span>
        </div>
      </div>

      {/* Lab Editor */}
      <CodeLab
        initialHtml={lab.starterHtml}
        initialCss={lab.starterCss}
        lab={lab}
      />
    </div>
    </>
  )
}
