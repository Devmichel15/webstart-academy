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
import { useProgress } from '../context/ProgressContext'
import { courses } from '../data/courses'
import { useGsapReveal } from '../hooks/useGsapReveal'

const statIcons = {
  progress: Target,
  lessons: BookOpen,
  time: Clock,
  streak: Flame,
}

export default function Dashboard() {
  const {
    progressPercent,
    completedCount,
    totalLessons,
    remainingMinutes,
    lastLesson,
    recommendedLesson,
    streak,
    achievements,
    getCourseProgress,
  } = useProgress()

  const heroRef = useGsapReveal([progressPercent])
  const unlockedAchievements = achievements.filter((item) => item.unlocked)

  const stats = [
    { label: 'Progresso geral', value: `${progressPercent}%`, icon: 'progress' },
    { label: 'Aulas concluídas', value: `${completedCount}/${totalLessons}`, icon: 'lessons' },
    { label: 'Tempo restante', value: `~${remainingMinutes} min`, icon: 'time' },
    { label: 'Streak', value: `${streak} dias`, icon: 'streak' },
  ]

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Acompanhe seu progresso na WebStart Academy."
      />

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
          {courses.map((course) => (
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
