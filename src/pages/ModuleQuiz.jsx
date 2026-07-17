import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SEO } from '../components/seo/SEO'
import { Header } from '../components/layout/Header'
import { QuizBlock } from '../components/lesson/sections/QuizBlock.jsx'
import { getModuleData } from '../data/trails.js'
import { useProgressContext } from '../contexts/ProgressContext.jsx'

export default function ModuleQuiz() {
  const { courseId, moduleId } = useParams()
  const navigate = useNavigate()
  const { completeQuiz } = useProgressContext()
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

  const handleQuizComplete = async (score, totalQuestions) => {
    await completeQuiz(moduleId, score, totalQuestions)
    navigate(`/trilhas/${courseId}/modulo/${moduleId}`)
  }

  return (
    <>
    <SEO title={mod ? `Quiz: ${mod.title}` : 'Quiz'} description={`Teste seus conhecimentos em ${mod ? mod.title : 'desenvolvimento web'} com este quiz interativo.`} url={`/trilhas/${courseId}/modulo/${moduleId}/quiz`} />
    <div>
      <Link to={`/trilhas/${courseId}/modulo/${moduleId}`} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
        <ArrowLeft size={16} />
        Voltar para {mod.title}
      </Link>

      <Header title={mod.quiz.title} subtitle="Teste seus conhecimentos sobre o módulo" />

      <QuizBlock quiz={mod.quiz} onComplete={handleQuizComplete} />
    </div>
    </>
  )
}
