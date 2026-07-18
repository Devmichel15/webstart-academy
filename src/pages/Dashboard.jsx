import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SEO } from '../components/seo/SEO'
import {
  ArrowRight,
  BookOpen,
  Clock,
  Flame,
  Map,
  Sparkles,
  Target,
  Trophy,
  Rocket,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { TrilhaBadgeCard } from '../components/TrilhaBadgeCard.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { allLessons, allVideoLessons } from '../data/lessons/index.js'
import { useGsapReveal } from '../hooks/useGsapReveal'

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
    streak,
    achievements,
    getCourseProgress,
    isLessonCompleted,
    loading,
    journeyProgress,
    getTrailStatus,
    trails: allTrails,
    firstStepsDone,
  } = useProgress()

  const heroRef = useGsapReveal([progressPercent, name])

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Carregando seus dados..." />
        <PageSkeleton />
      </div>
    )
  }

  const unlockedAchievements = achievements.filter((item) => item.unlocked)

  const stats = [
    { label: 'Progresso geral', value: `${progressPercent}%`, icon: 'progress' },
    { label: 'Aulas concluídas', value: `${completedCount}/${totalLessons}`, icon: 'lessons' },
    { label: 'Horas estudadas', value: `${studyHours}h`, icon: 'time' },
    { label: 'Streak', value: `${streak} dias`, icon: 'streak' },
  ]

  const orderedTrails = (allTrails || []).sort((a, b) => a.order - b.order)

  const displayTrails = orderedTrails.filter((t) => t.status !== 'soon')

  const allCombinedLessons = [...allLessons, ...allVideoLessons].sort((a, b) => {
    const trailOrderA = orderedTrails.findIndex((t) => t.id === a.courseId)
    const trailOrderB = orderedTrails.findIndex((t) => t.id === b.courseId)
    if (trailOrderA !== trailOrderB) return trailOrderA - trailOrderB
    return a.order - b.order
  })

  const firstIncompleteLesson = allCombinedLessons.find((l) => !isLessonCompleted(l.id))

  return (
    <>
    <SEO title="Dashboard" description="Acompanhe seu progresso, XP, streak e continue seus estudos na WebStart Academy." url="/" keywords="dashboard, progresso, webstart, estudos" />
    <div>
      <Header
        title={`Olá, ${name || 'Aluno'}!`}
        subtitle="Acompanhe seu progresso na WebStart Academy em tempo real."
      />

      {firstStepsDone === false && (
        <Card className="mb-8 border-2 border-brand-400 bg-brand-50 dark:bg-brand-900/30">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Rocket size={24} />
            </div>
            <div className="flex-1">
              <p className="font-black">Continua o teu registo!</p>
              <p className="text-sm text-secondary">Começa a tua primeira aula para desbloquear todo o conteúdo.</p>
            </div>
            <Link to="/primeiros-passos">
              <Button>
                Começar agora
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <Card className="mb-8 flex flex-wrap items-center gap-4">
        {photoURL ? (
          <img src={photoURL} alt={name} className="h-16 w-16 rounded-full border-3 border-strong object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-3 border-strong bg-brand-500 text-2xl font-black text-white">
            {(name || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xl font-black">{name || 'Aluno WebStart'}</p>
          <p className="text-sm font-semibold text-secondary">
            Nível {level} · {xp} XP · {journeyProgress?.completedCount || 0} trilha(s) concluída(s)
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
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-strong bg-accent-soft">
                  <Icon size={20} />
                </div>
                <p className="text-sm font-semibold text-secondary">{stat.label}</p>
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
            <Map className="text-brand-500" size={20} />
            <h2 className="text-lg font-black">Sua Jornada</h2>
          </div>
          <div className="mb-4 flex items-center justify-between rounded-lg border-2 border bg-surface-hover p-3">
            <div>
              <p className="text-xs font-semibold text-secondary">Trilhas concluídas</p>
              <p className="text-2xl font-black">{journeyProgress?.completedCount || 0}<span className="text-lg text-secondary">/{journeyProgress?.totalCount || 0}</span></p>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-strong bg-brand-500 text-white flex items-center justify-center text-sm font-black">
              {journeyProgress?.percent || 0}%
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {orderedTrails.slice(0, 5).map((trail) => {
              const trailStatus = getTrailStatus(trail.id)
              const progress = getCourseProgress(trail.id)

              return (
                <TrilhaBadgeCard
                  key={trail.id}
                  trail={trail}
                  status={trailStatus}
                  progress={progress}
                  completedLessons={0}
                  totalLessons={0}
                  compact
                />
              )
            })}
          </div>
          {orderedTrails.length > 5 && (
            <Link to="/trilhas" className="mt-3 block text-center text-xs font-bold text-secondary hover:underline">
              Ver todas as {orderedTrails.length} trilhas
            </Link>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="text-brand-500" size={20} />
            <h2 className="text-lg font-black">Próxima aula</h2>
          </div>
          {firstIncompleteLesson ? (
            <div>
              <p className="mb-1 font-bold">{firstIncompleteLesson.title}</p>
              <p className="mb-4 text-sm text-secondary">{firstIncompleteLesson.description}</p>
              <Link to={firstIncompleteLesson.type === 'videoLesson' ? `/video-aula/${firstIncompleteLesson.id}` : `/aula/${firstIncompleteLesson.id}`}>
                <Button>
                  Continuar
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          ) : (
            <p className="font-bold text-secondary">Parabéns! Você concluiu todos os módulos.</p>
          )}
        </Card>
      </div>

      {displayTrails.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-black">Suas trilhas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {displayTrails.map((trail) => {
              const trailStatus = getTrailStatus(trail.id)
              const progress = getCourseProgress(trail.id)

              return (
                <TrilhaBadgeCard
                  key={trail.id}
                  trail={trail}
                  status={trailStatus}
                  progress={progress}
                  completedLessons={0}
                  totalLessons={0}
                />
              )
            })}
          </div>
        </section>
      )}

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
                  ? 'border-strong bg-accent-soft'
                  : 'border opacity-50'
              }`}
            >
              <p className="font-bold">{achievement.title}</p>
              <p className="text-sm text-secondary">{achievement.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold text-secondary">
          {unlockedAchievements.length}/{achievements.length} desbloqueadas
        </p>
      </section>
    </div>
    </>
  )
}
