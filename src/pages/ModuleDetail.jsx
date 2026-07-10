import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Circle, Clock, FlaskConical, HelpCircle, PlayCircle, Trophy } from 'lucide-react'
import { SEO } from '../components/seo/SEO'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { getModuleData, getTrailById, getModuleLessons } from '../data/trails.js'
import { useProgress } from '../hooks/useProgress.js'
import { XP_LESSON } from '../utils/xp.js'


export default function ModuleDetail() {
  const { courseId, moduleId } = useParams()
  const [module, setModule] = useState(null)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const { isLessonCompleted } = useProgress()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const mod = getModuleData(moduleId)
      const crs = getTrailById(courseId)
      const less = getModuleLessons(moduleId)
      setModule(mod)
      setCourse(crs)
      setLessons(less)
      setLoading(false)
    }
    load()
  }, [courseId, moduleId])

  if (loading) {
    return (
      <div>
        <Header title="Módulo" subtitle="Carregando..." />
        <PageSkeleton />
      </div>
    )
  }

  if (!module || !course) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Módulo não encontrado</h1>
        <Link to="/trilhas" className="mt-4 inline-block font-bold text-brand-600 underline">Voltar às trilhas</Link>
      </div>
    )
  }

  const completedLessons = lessons.filter((l) => isLessonCompleted(l.id))
  const progress = lessons.length ? Math.round((completedLessons.length / lessons.length) * 100) : 0

  return (
    <>
    <SEO title={module.title} description={`Módulo ${module.title} do curso ${course.title}. Aprenda ${module.title} na WebStart Academy.`} url={`/trilhas/${courseId}/modulo/${moduleId}`} />
    <div>
      <Link to={`/trilhas/${courseId}`} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
        <ArrowLeft size={16} />
        Voltar para {course.title}
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-2xl border-3 border-brand-800 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-[6px_6px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[6px_6px_0_0_#34d399]"
      >
        <Badge className="mb-3 !border-white/30 !bg-white/20 !text-white">Módulo {module.order}</Badge>
        <h1 className="mb-2 text-2xl font-black md:text-3xl">{module.title}</h1>
        <p className="max-w-2xl text-brand-100">{module.description}</p>
      </motion.section>

      <div className="mb-4 h-2 overflow-hidden rounded-full border-2 border-brand-800 bg-brand-100 dark:bg-brand-900">
        <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="mb-6 text-sm font-bold text-brand-600">{completedLessons.length}/{lessons.length} aulas concluídas</p>

      <div className="mb-8 space-y-3">
        <h2 className="text-lg font-black">Aulas</h2>
        {lessons.map((lesson, index) => {
          const completed = isLessonCompleted(lesson.id)
          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={lesson.type === 'videoLesson' ? `/video-aula/${lesson.id}` : `/aula/${lesson.id}`} className="block">
                <Card hover className="!p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {completed ? (
                        <CheckCircle2 className="mt-1 shrink-0 text-brand-500" size={22} />
                      ) : (
                        <Circle className="mt-1 shrink-0 text-brand-300" size={22} />
                      )}
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          {lesson.type === 'videoLesson' ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
                              <PlayCircle size={12} />
                              Vídeo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
                              <Clock size={12} />
                              {lesson.duration} min
                            </span>
                          )}
                          <span className="text-xs font-semibold text-brand-600">+{XP_LESSON} XP</span>
                        </div>
                        <h3 className="font-black">{lesson.title}</h3>
                        <p className="text-sm text-brand-700 dark:text-brand-300">{lesson.description}</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      {completed ? 'Revisar' : lesson.type === 'videoLesson' ? 'Assistir' : 'Iniciar'}
                    </Button>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {module.quiz && (
          <Link to={`/trilhas/${courseId}/modulo/${moduleId}/quiz`}>
            <Card hover className="h-full !border-amber-500 dark:!border-amber-400">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-[3px_3px_0_0_#92400e]">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h3 className="font-black">Quiz</h3>
                  <p className="text-sm text-brand-700 dark:text-brand-300">{module.quiz.questions.length} questões</p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {module.lab && (
          <Link to={`/trilhas/${courseId}/modulo/${moduleId}/lab`}>
            <Card hover className="h-full !border-teal-500 dark:!border-teal-400">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-[3px_3px_0_0_#115e59]">
                  <FlaskConical size={24} />
                </div>
                <div>
                  <h3 className="font-black">Laboratório</h3>
                  <p className="text-sm text-brand-700 dark:text-brand-300">Prática guiada</p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {module.miniProject && (
          <Link to={`/trilhas/${courseId}/modulo/${moduleId}/mini-projeto`}>
            <Card hover className="h-full !border-purple-500 dark:!border-purple-400">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[3px_3px_0_0_#581c87]">
                  <Trophy size={24} />
                </div>
                <div>
                  <h3 className="font-black">Mini Projeto</h3>
                  <p className="text-sm text-brand-700 dark:text-brand-300">Construa algo real</p>
                </div>
              </div>
            </Card>
          </Link>
        )}
      </div>
    </div>
    </>
  )
}
