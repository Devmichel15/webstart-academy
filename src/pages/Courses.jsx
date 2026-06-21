import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Code2, Palette } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Button } from '../components/ui/Button'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { useCourses } from '../hooks/useCourses.js'
import { getCourseWithLessons } from '../services/courseService.js'
import { courses as staticCourses } from '../data/courses.js'
import { useEffect, useState } from 'react'

const courseIcons = {
  html: Code2,
  css: Palette,
}

export default function Courses() {
  const { getCourseProgress, isLessonCompleted } = useProgress()
  const { courses, loading } = useCourses()
  const [courseDetails, setCourseDetails] = useState([])

  useEffect(() => {
    async function loadDetails() {
      const source = courses.length ? courses : staticCourses
      const details = await Promise.all(source.map((course) => getCourseWithLessons(course.id)))
      setCourseDetails(details.filter(Boolean))
    }

    loadDetails()
  }, [courses])

  if (loading && !courseDetails.length) {
    return (
      <div>
        <Header title="Cursos" subtitle="Carregando cursos..." />
        <PageSkeleton />
      </div>
    )
  }

  const displayCourses = courseDetails.length ? courseDetails : staticCourses

  return (
    <div>
      <Header
        title="Cursos"
        subtitle="HTML5 e CSS3 — do zero ao projeto final."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {displayCourses.map((course, index) => {
          const Icon = courseIcons[course.id] || Code2
          const progress = getCourseProgress(course.id)
          const lessons = course.lessons || []
          const completedInCourse = lessons.filter((lesson) => isLessonCompleted(lesson.id)).length

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border-3 border-brand-800 bg-brand-500 text-white shadow-[4px_4px_0_0_#064e3b] dark:border-brand-400">
                    <Icon size={28} />
                  </div>
                  <span className="rounded-lg border-2 border-brand-800 px-2 py-1 text-xs font-bold dark:border-brand-400">
                    {lessons.length} módulos
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-black">{course.title}</h2>
                <p className="mb-4 text-brand-700 dark:text-brand-300">{course.description}</p>
                <ProgressBar value={progress} label={`${completedInCourse}/${lessons.length} aulas`} className="mb-4" />

                <Link to={`/cursos/${course.id}`}>
                  <Button>
                    Explorar curso
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
