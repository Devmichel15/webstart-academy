import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { getCourseWithLessons } from '../services/courseService.js'
import { useProgress } from '../hooks/useProgress.js'
import { XP_LESSON } from '../utils/xp.js'

export default function CourseDetail() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isLessonCompleted, getCourseProgress } = useProgress()

  useEffect(() => {
    async function loadCourse() {
      setLoading(true)
      const data = await getCourseWithLessons(courseId)
      setCourse(data)
      setLoading(false)
    }

    loadCourse()
  }, [courseId])

  if (loading) {
    return (
      <div>
        <Header title="Curso" subtitle="Carregando módulos..." />
        <PageSkeleton />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Curso não encontrado</h1>
        <Link to="/cursos" className="mt-4 inline-block font-bold text-brand-600 underline">
          Voltar aos cursos
        </Link>
      </div>
    )
  }

  const lessons = course.lessons || []

  return (
    <div>
      <Header
        title={course.title}
        subtitle={course.description}
      />

      <div className="mb-6 rounded-xl border-3 border-brand-800 bg-brand-50 p-4 dark:border-brand-400 dark:bg-brand-950">
        <p className="text-sm font-bold">Progresso do curso: {getCourseProgress(course.id)}%</p>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson, index) => {
          const completed = isLessonCompleted(lesson.id)

          return (
            <Card key={lesson.id} hover className="!p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {completed ? (
                    <CheckCircle2 className="mt-1 shrink-0 text-brand-500" size={22} />
                  ) : (
                    <Circle className="mt-1 shrink-0 text-brand-300" size={22} />
                  )}
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge>Módulo {index + 1}</Badge>
                      <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
                        <Clock size={12} />
                        {lesson.duration} min
                      </span>
                      <span className="text-xs font-semibold text-brand-600">+{XP_LESSON} XP</span>
                    </div>
                    <h3 className="font-black">{lesson.title}</h3>
                    <p className="text-sm text-brand-700 dark:text-brand-300">{lesson.description}</p>
                  </div>
                </div>
                <Link
                  to={`/aula/${lesson.id}`}
                  className="rounded-lg border-3 border-brand-800 bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_#064e3b] transition hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-brand-400"
                >
                  {completed ? 'Revisar' : 'Iniciar'}
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
