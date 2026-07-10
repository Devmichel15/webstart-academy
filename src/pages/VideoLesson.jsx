import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Loader2, PlayCircle, BookOpen, Wrench } from 'lucide-react'
import { SEO } from '../components/seo/SEO'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { getTrailById, getModuleData } from '../data/trails.js'
import { getVideoLessonById, getVideoLessonsByModule } from '../data/lessons/index.js'
import { useProgress } from '../hooks/useProgress.js'
import { XP_LESSON } from '../utils/xp.js'

export default function VideoLesson() {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [module, setModule] = useState(null)
  const [course, setCourse] = useState(null)
  const [moduleLessons, setModuleLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const { completeLesson, visitLesson, isLessonCompleted, getCourseProgress } = useProgress()

  useEffect(() => {
    async function loadLesson() {
      setLoading(true)
      const data = getVideoLessonById(lessonId)
      setLesson(data)

      if (data?.moduleId) {
        const mod = getModuleData(data.moduleId)
        setModule(mod)

        if (mod?.courseId) {
          const crs = getTrailById(mod.courseId)
          setCourse(crs)
        }

        const lessons = getVideoLessonsByModule(data.moduleId)
        setModuleLessons(lessons)
      }

      setLoading(false)
    }

    loadLesson()
  }, [lessonId])

  useEffect(() => {
    if (lesson) visitLesson(lesson.id)
  }, [lesson, visitLesson])

  if (loading) {
    return (
      <div>
        <Header title="Aula" subtitle="Carregando..." />
        <PageSkeleton />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Aula não encontrada</h1>
        <Link to="/trilhas" className="mt-4 inline-block font-bold text-brand-600 underline">
          Voltar às trilhas
        </Link>
      </div>
    )
  }

  const currentIndex = moduleLessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : null
  const completed = isLessonCompleted(lesson.id)

  const courseProgress = course ? getCourseProgress(course.id) : 0
  const completedCount = course ? Math.round((courseProgress / 100) * (course.modules?.length || 0)) : 0

  const handleComplete = async () => {
    setCompleting(true)
    await completeLesson(lesson.id)
    setCompleting(false)
  }

  return (
    <>
      <SEO
        title={lesson.title}
        description={lesson.description}
        url={`/video-aula/${lessonId}`}
      />
      <div>
        <Link
          to={`/trilhas/${course?.id}/modulo/${module?.id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline"
        >
          <ArrowLeft size={16} />
          Voltar para {module?.title}
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-2xl border-3 border-brand-800 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-[6px_6px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[6px_6px_0_0_#34d399]"
        >
          <Badge className="mb-3 !border-white/30 !bg-white/20 !text-white">
            <PlayCircle size={12} className="mr-1" />
            Exercício em Vídeo
          </Badge>
          <h1 className="mb-2 text-2xl font-black md:text-3xl">{lesson.title}</h1>
          <p className="max-w-2xl text-brand-100">{lesson.description}</p>
        </motion.section>

        <div className="mb-4 h-2 overflow-hidden rounded-full border-2 border-brand-800 bg-brand-100 dark:bg-brand-900">
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${courseProgress}%` }}
          />
        </div>
        <p className="mb-6 text-sm font-bold text-brand-600">
          {completedCount}/{course?.modules?.length || 0} módulos concluídos
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="!p-0 overflow-hidden">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={lesson.embedUrl}
                title={lesson.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        </motion.div>

        <div className="mb-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h2 className="mb-2 text-lg font-black">{lesson.title}</h2>
              <p className="text-brand-700 dark:text-brand-300">{lesson.description}</p>
            </Card>
          </motion.div>

          {lesson.objectives && lesson.objectives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen size={20} className="text-brand-500" />
                  <h3 className="font-black">O que você irá aprender</h3>
                </div>
                <ul className="space-y-2">
                  {lesson.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-brand-700 dark:text-brand-300">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-500" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {lesson.materials && lesson.materials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Wrench size={20} className="text-brand-500" />
                  <h3 className="font-black">Materiais da aula</h3>
                </div>
                <ul className="space-y-2">
                  {lesson.materials.map((mat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-brand-700 dark:text-brand-300">
                      <Circle size={8} className="mt-1.5 shrink-0 text-brand-400" />
                      {mat}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <h2 className="mb-4 text-lg font-black">Concluir Aula</h2>
            {!completed ? (
              <Button onClick={handleComplete} disabled={completing} className="w-full sm:w-auto">
                {completing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  `Marcar como concluída (+${XP_LESSON} XP)`
                )}
              </Button>
            ) : (
              <p className="font-bold text-brand-600">Aula concluída! Progresso salvo na nuvem.</p>
            )}
          </Card>
        </motion.div>

        <div className="flex items-center justify-between gap-4">
          {prevLesson ? (
            <Link to={`/video-aula/${prevLesson.id}`}>
              <Button variant="secondary">
                <ArrowLeft size={16} />
                Aula anterior
              </Button>
            </Link>
          ) : (
            <div />
          )}
          {nextLesson ? (
            <Link to={`/video-aula/${nextLesson.id}`}>
              <Button>
                Próxima aula
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            <Link to={`/trilhas/${course?.id}/modulo/${module?.id}`}>
              <Button>
                Ver módulo
                <ArrowRight size={16} />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
