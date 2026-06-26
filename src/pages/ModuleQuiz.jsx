import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { QuizBlock } from '../components/lesson/sections/QuizBlock.jsx'
import { getModuleData } from '../data/roadmaps.js'

export default function ModuleQuiz() {
  const { courseId, moduleId } = useParams()
  const mod = getModuleData(moduleId)

  if (!mod || !mod.quiz) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Quiz não encontrado</h1>
        <Link to={`/trilhas/${courseId}/modulo/${moduleId}`} className="mt-4 inline-block font-bold text-brand-600 underline">
          Voltar ao módulo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to={`/trilhas/${courseId}/modulo/${moduleId}`} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
        <ArrowLeft size={16} />
        Voltar para {mod.title}
      </Link>

      <Header title={mod.quiz.title} subtitle="Teste seus conhecimentos sobre o módulo" />

      <QuizBlock quiz={mod.quiz} />
    </div>
  )
}
