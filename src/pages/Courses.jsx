import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Code2, Palette, BookOpen, GraduationCap } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { roadmaps, getCourseById, getModuleData } from '../data/roadmaps.js'
import { useEffect, useState } from 'react'

const courseIcons = {
  html: Code2,
  css: Palette,
}

const roadmapIcons = {
  frontend: Code2,
  backend: GraduationCap,
}

export default function Courses() {
  const { getCourseProgress, isLessonCompleted } = useProgress()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div>
        <Header title="Trilhas" subtitle="Carregando..." />
        <PageSkeleton />
      </div>
    )
  }

  return (
    <div>
      <Header
        title="Trilhas de Aprendizagem"
        subtitle="Roadmaps completos para se tornar um desenvolvedor profissional."
      />

      <div className="space-y-10">
        {roadmaps.filter((r) => r.courses.length > 0).map((roadmap, rIndex) => {
          const RoadmapIcon = roadmapIcons[roadmap.id] || BookOpen
          const roadmapCourses = roadmap.courses.map((cId) => getCourseById(cId)).filter(Boolean)

          return (
            <motion.section
              key={roadmap.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rIndex * 0.1 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-3 border-brand-800 bg-brand-500 text-white shadow-[3px_3px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[3px_3px_0_0_#34d399]">
                  <RoadmapIcon size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black">{roadmap.title}</h2>
                  <p className="text-sm text-brand-700 dark:text-brand-300">{roadmap.description}</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {roadmapCourses.map((course, cIndex) => {
                  const Icon = courseIcons[course.id] || Code2
                  const progress = getCourseProgress(course.id)
                  const modules = (course.modules || []).map((mId) => getModuleData(mId)).filter(Boolean)
                  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
                  const completedInCourse = modules.reduce((sum, m) => sum + (m.lessons?.filter((lId) => isLessonCompleted(lId)).length || 0), 0)

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (rIndex * 0.1) + (cIndex * 0.05) }}
                    >
                      <Card hover className="h-full">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl border-3 border-brand-800 bg-brand-500 text-white shadow-[4px_4px_0_0_#064e3b] dark:border-brand-400">
                            <Icon size={28} />
                          </div>
                          <div className="flex gap-1">
                            {course.status === 'building' && (
                              <span className="rounded-lg border-2 border-yellow-500 px-2 py-1 text-xs font-bold text-yellow-600 dark:border-yellow-400 dark:text-yellow-300">
                                Em construção
                              </span>
                            )}
                            {course.status === 'soon' && (
                              <span className="rounded-lg border-2 border-gray-400 px-2 py-1 text-xs font-bold text-gray-500 dark:border-gray-500 dark:text-gray-400">
                                Em breve
                              </span>
                            )}
                            <span className="rounded-lg border-2 border-brand-800 px-2 py-1 text-xs font-bold dark:border-brand-400">
                              {modules.length} módulos
                            </span>
                            <span className="rounded-lg border-2 border-brand-800 px-2 py-1 text-xs font-bold dark:border-brand-400">
                              {totalLessons} aulas
                            </span>
                          </div>
                        </div>

                        <h2 className="mb-2 text-2xl font-black">{course.title}</h2>
                        <p className="mb-4 text-brand-700 dark:text-brand-300">{course.description}</p>

                        <div className="mb-4 flex flex-wrap gap-1">
                          <Badge>{course.difficulty === 'beginner' ? 'Iniciante' : course.difficulty}</Badge>
                          <Badge variant="success">{course.estimatedHours}h</Badge>
                        </div>

                        <ProgressBar value={progress} label={`${completedInCourse}/${totalLessons} aulas`} className="mb-4" />

                        <Link to={`/trilhas/${course.id}`}>
                          <Button>
                            Explorar trilha
                            <ArrowRight size={16} />
                          </Button>
                        </Link>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>
          )
        })}
      </div>
    </div>
  )
}
