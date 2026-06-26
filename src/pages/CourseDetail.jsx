import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Circle, ArrowRight, FlaskConical, HelpCircle, Trophy, Award } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { getCourseById, getModuleData } from '../data/roadmaps.js'
import { getLessonById } from '../data/lessons/index.js'
import { useProgress } from '../hooks/useProgress.js'
import { XP_LESSON } from '../utils/xp.js'

export default function CourseDetail() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isLessonCompleted, getCourseProgress } = useProgress()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = getCourseById(courseId)
      setCourse(data)
      setLoading(false)
    }
    load()
  }, [courseId])

  if (loading) {
    return (
      <div>
        <Header title="Trilha" subtitle="Carregando módulos..." />
        <PageSkeleton />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Trilha não encontrada</h1>
        <Link to="/trilhas" className="mt-4 inline-block font-bold text-brand-600 underline">Voltar às trilhas</Link>
      </div>
    )
  }

  const modules = (course.modules || []).map((mId) => getModuleData(mId)).filter(Boolean)
  const progress = getCourseProgress(course.id)
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
  const completedLessons = modules.reduce((sum, m) => sum + (m.lessons?.filter((lId) => isLessonCompleted(lId)).length || 0), 0)

  return (
    <div>
      <Header title={course.title} subtitle={course.description} />

      <div className="mb-6 rounded-xl border-3 border-brand-800 bg-brand-50 p-4 dark:border-brand-400 dark:bg-brand-950">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold">Progresso da trilha</p>
          <span className="text-sm font-bold text-brand-600">{completedLessons}/{totalLessons} aulas</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border-2 border-brand-800 bg-brand-100 dark:bg-brand-900">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-6">
        {modules.map((mod, modIndex) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: modIndex * 0.08 }}
          >
            <Card className="!p-0 overflow-hidden">
              <div className="border-b-3 border-brand-800 bg-gradient-to-r from-brand-500 to-brand-600 p-4 text-white dark:border-brand-400">
                <Badge className="mb-2 !border-white/30 !bg-white/20 !text-white">Módulo {modIndex + 1}</Badge>
                <h2 className="text-lg font-black">{mod.title}</h2>
                <p className="text-sm text-brand-100">{mod.description}</p>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                    {(mod.lessons || []).map((lessonId) => {
                    const lesson = findLesson(lessonId)
                    const completed = isLessonCompleted(lessonId)
                    if (!lesson) return null

                    return (
                      <Link key={lessonId} to={`/aula/${lessonId}`} className="block">
                        <div className={`flex items-center justify-between rounded-lg border-2 p-3 transition hover:border-brand-500 ${
                          completed ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-brand-200 dark:border-brand-700'
                        }`}>
                          <div className="flex items-center gap-3">
                            {completed ? (
                              <CheckCircle2 className="shrink-0 text-green-500" size={20} />
                            ) : (
                              <Circle className="shrink-0 text-brand-300" size={20} />
                            )}
                            <div>
                              <p className="text-sm font-bold">{lesson.title}</p>
                              <span className="text-xs font-semibold text-brand-600">
                                {lesson.duration} min · +{XP_LESSON} XP
                              </span>
                            </div>
                          </div>
                          <Button variant="secondary" size="sm">{completed ? 'Revisar' : 'Iniciar'}</Button>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {mod.quiz && (
                    <Link to={`/trilhas/${courseId}/modulo/${mod.id}/quiz`}>
                      <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-amber-200 bg-amber-50 p-2 text-center text-xs font-bold text-amber-800 transition hover:border-amber-500 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <HelpCircle size={16} />
                        Quiz
                      </div>
                    </Link>
                  )}
                  {mod.lab && (
                    <Link to={`/trilhas/${courseId}/modulo/${mod.id}/lab`}>
                      <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-teal-200 bg-teal-50 p-2 text-center text-xs font-bold text-teal-800 transition hover:border-teal-500 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
                        <FlaskConical size={16} />
                        Lab
                      </div>
                    </Link>
                  )}
                  {mod.miniProject && (
                    <Link to={`/trilhas/${courseId}/modulo/${mod.id}/mini-projeto`}>
                      <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-purple-200 bg-purple-50 p-2 text-center text-xs font-bold text-purple-800 transition hover:border-purple-500 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-200">
                        <Trophy size={16} />
                        Projeto
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8">
        <Link to={`/trilhas/${courseId}/conclusao`}>
          <Button className="w-full">
            <Award size={18} />
            Ver conclusão da trilha
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function findLesson(lessonId) {
  return getLessonById(lessonId)
}
