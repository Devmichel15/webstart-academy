import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Clock,
  Flame,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { useCourses } from '../hooks/useCourses.js'
import { getCourseWithLessons } from '../services/courseService.js'
import { courses as staticCourses } from '../data/courses.js'
import { useGsapReveal } from '../hooks/useGsapReveal'
import { useEffect, useState } from 'react'

const statIcons = {
  progress: Target,
  lessons: BookOpen,
  time: Clock,
  streak: Flame,
}

export default function Dashboard() {
  const {
    name,
    photoURL,
    xp,
    level,
    progressPercent,
    completedCount,
    totalLessons,
    studyHours,
    completedCourses,
    streak,
    achievements,
    getCourseProgress,
    recommendedLesson,
    lastLesson,
    loading,
  } = useProgress()

  const { courses } = useCourses()
  const [courseDetails, setCourseDetails] = useState(staticCourses)
  const heroRef = useGsapReveal([progressPercent, name])

  useEffect(() => {
    async function loadCourses() {
      const details = await Promise.all(
        courses.map(async (course) => getCourseWithLessons(course.id)),
      )
      setCourseDetails(details.filter(Boolean))
    }

    if (courses.length) loadCourses()
  }, [courses])

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Carregando seus dados..." />
        <PageSkeleton />
      </div>
    )
  }

  const unlockedAchievements = achievements.filter((item) => item.unlocked)
  const displayCourses = courseDetails.length ? courseDetails : staticCourses

  const stats = [
    { label: 'Progresso geral', value: `${progressPercent}%`, icon: 'progress' },
    { label: 'Aulas concluídas', value: `${completedCount}/${totalLessons}`, icon: 'lessons' },
    { label: 'Horas estudadas', value: `${studyHours}h`, icon: 'time' },
    { label: 'Streak', value: `${streak} dias`, icon: 'streak' },
  ]

  return (
    <div>
      <Header
        title={`Olá, ${name || 'Aluno'}!`}
        subtitle="Acompanhe seu progresso na WebStart Academy em tempo real."
      />

      <Card className="mb-8 flex flex-wrap items-center gap-4">
        {photoURL ? (
          <img src={photoURL} alt={name} className="h-16 w-16 rounded-full border-3 border-brand-800 object-cover dark:border-brand-400" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-3 border-brand-800 bg-brand-500 text-2xl font-black text-white dark:border-brand-400">
            {(name || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xl font-black">{name || 'Aluno WebStart'}</p>
          <p className="text-sm font-semibold text-brand-600">
            Nível {level} · {xp} XP · {completedCourses.length} curso(s) concluído(s)
          </p>
        </div>
      </Card>

      <div ref={heroRef} className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = statIcons[stat.icon]
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card hover className="h-full">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-brand-800 bg-brand-100 dark:border-brand-400 dark:bg-brand-900">
                  <Icon size={20} />
                </div>
                <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="mb-8">
        <ProgressBar value={progressPercent} label="Progresso total" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="text-brand-500" size={20} />
            <h2 className="text-lg font-black">Sequência recomendada</h2>
          </div>
          {recommendedLesson ? (
            <div>
              <p className="mb-1 font-bold">{recommendedLesson.title}</p>
              <p className="mb-4 text-sm text-brand-700 dark:text-brand-300">{recommendedLesson.description}</p>
              <Link to={`/aula/${recommendedLesson.id}`}>
                <Button>
                  Continuar
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          ) : (
            <p className="font-bold text-brand-600">Parabéns! Você concluiu todos os módulos.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-black">Última aula acessada</h2>
          {lastLesson ? (
            <div>
              <p className="font-bold">{lastLesson.title}</p>
              <p className="mb-4 text-sm text-brand-700 dark:text-brand-300">{lastLesson.courseId.toUpperCase()}</p>
              <Link to={`/aula/${lastLesson.id}`}>
                <Button variant="secondary">Revisar aula</Button>
              </Link>
            </div>
          ) : (
            <p className="text-brand-700 dark:text-brand-300">Nenhuma aula acessada ainda. Comece pelo curso HTML!</p>
          )}
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-black">Seus cursos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {displayCourses.map((course) => (
            <Card key={course.id} hover>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-black">{course.title}</h3>
                <span className="text-sm font-bold">{getCourseProgress(course.id)}%</span>
              </div>
              <p className="mb-4 text-sm text-brand-700 dark:text-brand-300">{course.description}</p>
              <ProgressBar value={getCourseProgress(course.id)} className="mb-4" />
              <Link to={`/cursos/${course.id}`}>
                <Button variant="secondary" size="sm">Ver módulos</Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="text-brand-500" size={20} />
          <h2 className="text-lg font-black">Conquistas</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`rounded-xl border-3 p-4 ${
                achievement.unlocked
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900'
                  : 'border-brand-200 opacity-50 dark:border-brand-800'
              }`}
            >
              <p className="font-bold">{achievement.title}</p>
              <p className="text-sm text-brand-700 dark:text-brand-300">{achievement.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold text-brand-600">
          {unlockedAchievements.length}/{achievements.length} desbloqueadas
        </p>
      </section>
    </div>
  )
}
