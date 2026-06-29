import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { LessonRenderer } from '../components/lesson/LessonRenderer.jsx'
import { ShareButtons } from '../components/share/ShareButtons'
import { AITutor } from '../components/ai/AITutor'
import { getCourseById } from '../services/courseService.js'
import { getLessonById, getNextLesson } from '../services/lessonService.js'
import { useProgress } from '../hooks/useProgress.js'
import { XP_LESSON } from '../utils/xp.js'
import { getTrailById } from '../data/trails.js'
import { PremiumPage } from '../components/premium/PremiumPage.jsx'
import { hasPremiumAccess } from '../utils/premium.js'

export default function Lesson() {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const { completeLesson, visitLesson, isLessonCompleted, name, level, streak, achievements, isPremium, purchasedCourses } = useProgress()

  useEffect(() => {
    async function loadLesson() {
      setLoading(true)
      const data = await getLessonById(lessonId)
      setLesson(data)

      if (data?.courseId) {
        const courseData = await getCourseById(data.courseId)
        setCourse(courseData)
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
        <Header title="Aula" subtitle="Carregando conteúdo..." />
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

  if (lesson?.courseId) {
    const trail = getTrailById(lesson.courseId)
    if (trail?.isPremium && !hasPremiumAccess(lesson.courseId, { isPremium, purchasedCourses })) {
      return (
        <div>
          <Header title={trail.title} subtitle="Conteúdo exclusivo" />
          <PremiumPage trail={trail} />
        </div>
      )
    }
  }

  const nextLesson = getNextLesson(lessonId, course?.lessons)
  const completed = isLessonCompleted(lesson.id)
  const latestBadge = achievements.filter((a) => a.unlocked).pop()?.title

  const shareData = completed ? {
    name: name || 'Aluno',
    title: `Aula: ${lesson.title}`,
    xpEarned: XP_LESSON,
    streak,
    level,
    badge: latestBadge,
    tagline: 'Aprendendo a estruturar a Web como um dev real',
  } : null

  const handleComplete = async () => {
    setCompleting(true)
    await completeLesson(lesson.id)
    setCompleting(false)
  }

  return (
    <div>
      <Link to={`/trilhas/${lesson.courseId}`} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-secondary hover:underline">
        <ArrowLeft size={16} />
        Voltar para {course?.title}
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-2xl border-3 border-brand-800 bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white shadow-[6px_6px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[6px_6px_0_0_#34d399]"
      >
        <Badge className="mb-4 !border-white/30 !bg-white/20 !text-white">{course?.title}</Badge>
        <h1 className="mb-2 text-3xl font-black md:text-4xl">{lesson.hero?.title || lesson.title}</h1>
        <p className="max-w-2xl text-brand-100">{lesson.hero?.subtitle || lesson.description}</p>
      </motion.section>

      <LessonRenderer lesson={lesson} />

      <div className="mt-8">
        <Card>
          <AITutor lessonContext={lesson.title} />
        </Card>
      </div>

      <div className="mt-8 space-y-4">
        <Card className="!p-5">
          <h2 className="mb-4 text-lg font-black">Concluir Aula</h2>
          {!completed ? (
            <Button onClick={handleComplete} disabled={completing} className="w-full sm:w-auto">
              {completing ? <Loader2 className="animate-spin" size={18} /> : `Concluir aula (+${XP_LESSON} XP)`}
            </Button>
          ) : (
            <div>
              <p className="mb-4 font-bold text-secondary">Aula concluída! Progresso salvo na nuvem.</p>
              {shareData && (
                <div className="border-t-2 border pt-4">
                  <p className="mb-2 text-sm font-bold text-secondary">Partilhar conquista</p>
                  <ShareButtons shareData={shareData} />
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {nextLesson && (
        <div className="mt-6 flex justify-end">
          <Link to={`/aula/${nextLesson.id}`}>
            <Button>
              Próxima aula: {nextLesson.title}
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border-3 border-strong bg-surface p-5 ${className}`}>
      {children}
    </div>
  )
}
