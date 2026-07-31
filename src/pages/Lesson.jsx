import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { SEO } from '../components/seo/SEO'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { LessonRenderer } from '../components/lesson/LessonRenderer.jsx'
import { AITutor } from '../components/ai/AITutor'
import { ProactiveTutorTrigger } from '../components/ai/ProactiveTutorTrigger'
import { getCourseById } from '../services/courseService.js'
import { getLessonById, getNextLesson } from '../services/lessonService.js'
import { useProgress } from '../hooks/useProgress.js'

export default function Lesson() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const { completeLesson, visitLesson } = useProgress()

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

  useEffect(() => {
    if (lesson?.type === 'videoLesson') {
      navigate(`/video-aula/${lesson.id}`, { replace: true })
    }
  }, [lesson, navigate])

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

  const nextLesson = getNextLesson(lessonId, course?.lessons)

  const handleGoNext = async () => {
    if (!nextLesson) return
    await completeLesson(lesson.id)
    const target = nextLesson.type === 'videoLesson' ? `/video-aula/${nextLesson.id}` : `/aula/${nextLesson.id}`
    navigate(target)
  }

  return (
    <>
    <SEO title={lesson.hero?.title || lesson.title} description={lesson.hero?.subtitle || lesson.description} url={`/aula/${lessonId}`} />
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

      <div id="ai-tutor" className="mt-8 scroll-mt-24">
        <Card>
          <AITutor lessonContext={lesson.title} />
        </Card>
      </div>

      {nextLesson && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleGoNext}>
            Próxima aula: {nextLesson.title}
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
    <ProactiveTutorTrigger />
    </>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border-3 border-strong bg-surface p-5 ${className}`}>
      {children}
    </div>
  )
}
