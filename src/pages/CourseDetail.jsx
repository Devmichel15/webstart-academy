import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Circle, ArrowRight, FlaskConical, HelpCircle, Trophy, Award } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SEO } from '../components/seo/SEO'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { getTrailById, getModuleData } from '../data/trails.js'
import { getLessonById } from '../data/lessons/index.js'
import { useProgress } from '../hooks/useProgress.js'
import { XP_LESSON } from '../utils/xp.js'


export default function CourseDetail() {
  const { courseId } = useParams()
  const [trail, setTrail] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isLessonCompleted, getCourseProgress, getTrailStatus } = useProgress()
  const status = getTrailStatus(courseId)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = getTrailById(courseId)
      setTrail(data)
      setLoading(false)
    }
    load()
  }, [courseId])

  if (loading) {
    return (
      <div>
        <Header title="Trilha" subtitle="Carregando módulos..." />
        <PageSkeleton />
      </div>
    )
  }

  if (!trail) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Trilha não encontrada</h1>
        <Link to="/trilhas" className="mt-4 inline-block font-bold text-secondary underline">Voltar às trilhas</Link>
      </div>
    )
  }

  if (trail.status === 'soon') {
    return (
      <div>
        <Header title={trail.title} subtitle={trail.description} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-muted bg-surface text-muted">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 className="mb-2 text-2xl font-black text-secondary">Em breve</h2>
          <p className="mb-6 max-w-md text-muted">
            Esta trilha está sendo preparada com conteúdo exclusivo. Volte em breve!
          </p>
          <Link to="/trilhas">
            <Button>
              Voltar para jornada
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const modules = (trail.modules || []).map((mId) => getModuleData(mId)).filter(Boolean)
  const progress = getCourseProgress(trail.id)
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
  const completedLessons = modules.reduce((sum, m) => sum + (m.lessons?.filter((lId) => isLessonCompleted(lId)).length || 0), 0)

  return (
    <>
    <SEO title={trail.title} description={trail.description} url={`/trilhas/${courseId}`} />
    <div>
      <Header
        title={trail.title}
        subtitle={trail.description}
        badge={
          status === 'completed' ? 'Concluído' :
          status === 'in_progress' ? 'Em andamento' :
          trail.status === 'building' ? 'Em construção' :
          'Disponível'
        }
      />

      {trail.status === 'building' && (
        <div className="mb-4 rounded-xl border-3 border-yellow-500 bg-yellow-50 p-3 text-sm font-semibold text-yellow-700 dark:border-yellow-400 dark:bg-yellow-950 dark:text-yellow-300">
          Esta trilha está em construção. Novos módulos serão adicionados em breve.
        </div>
      )}

      {totalLessons > 0 && (
        <div className="mb-6 rounded-xl border-3 border-strong bg-accent-soft p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold">Progresso da trilha</p>
            <span className="text-sm font-bold text-secondary">{completedLessons}/{totalLessons} aulas</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border-2 border-strong bg-surface-hover">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {modules.map((mod, modIndex) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: modIndex * 0.08 }}
          >
            <Card className="!p-0 overflow-hidden">
              <div className="border-b-3 border-strong bg-gradient-to-r from-brand-500 to-brand-600 p-4 text-white">
                <Badge className="mb-2 !border-white/30 !bg-white/20 !text-white">Módulo {modIndex + 1}</Badge>
                <h2 className="text-lg font-black">{mod.title}</h2>
                <p className="text-sm text-brand-100">{mod.description}</p>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                    {(mod.lessons || []).map((lessonId) => {
                    const lesson = findLesson(lessonId)
                    const completed = isLessonCompleted(lessonId)
                    if (!lesson) return null

                    const isBuilding = trail.status === 'building'
                    const lessonContent = (
                      <div className={`flex items-center justify-between rounded-lg border-2 p-3 transition ${
                        isBuilding
                          ? 'border bg-surface opacity-60'
                          : completed
                            ? 'border-accent bg-accent-soft'
                            : 'border hover:border-strong'
                      } ${isBuilding ? '' : ''}`}>
                        <div className="flex items-center gap-3">
                          {completed ? (
                            <CheckCircle2 className="shrink-0 text-green-500" size={20} />
                          ) : (
                            <Circle className="shrink-0 text-secondary" size={20} />
                          )}
                          <div>
                            <p className={`text-sm font-bold ${isBuilding ? 'text-muted' : ''}`}>{lesson.title}</p>
                            <span className="text-xs font-semibold text-secondary">
                              {lesson.duration} min · +{XP_LESSON} XP
                            </span>
                          </div>
                        </div>
                        {isBuilding ? (
                          <span className="rounded-lg border-2 border-yellow-400 px-2 py-1 text-xs font-bold text-yellow-600 dark:border-yellow-500 dark:text-yellow-400">
                            Em construção
                          </span>
                        ) : (
                          <Button variant="secondary" size="sm">{completed ? 'Revisar' : 'Iniciar'}</Button>
                        )}
                      </div>
                    )

                    return isBuilding ? (
                      <div key={lessonId} className="block cursor-not-allowed">
                        {lessonContent}
                      </div>
                    ) : (
                      <Link key={lessonId} to={lesson.type === 'videoLesson' ? `/video-aula/${lessonId}` : `/aula/${lessonId}`} className="block">
                        {lessonContent}
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {mod.quiz && (trail.status === 'building' ? (
                    <div className="flex cursor-not-allowed flex-col items-center gap-1 rounded-lg border-2 border bg-surface p-2 text-center text-xs font-bold text-muted opacity-60">
                      <HelpCircle size={16} />
                      Quiz
                    </div>
                  ) : (
                    <Link to={`/trilhas/${courseId}/modulo/${mod.id}/quiz`}>
                      <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-amber-200 bg-amber-50 p-2 text-center text-xs font-bold text-amber-800 transition hover:border-amber-500 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <HelpCircle size={16} />
                        Quiz
                      </div>
                    </Link>
                  ))}
                  {mod.lab && (trail.status === 'building' ? (
                    <div className="flex cursor-not-allowed flex-col items-center gap-1 rounded-lg border-2 border bg-surface p-2 text-center text-xs font-bold text-muted opacity-60">
                      <FlaskConical size={16} />
                      Lab
                    </div>
                  ) : (
                    <Link to={`/trilhas/${courseId}/modulo/${mod.id}/lab`}>
                      <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-teal-200 bg-teal-50 p-2 text-center text-xs font-bold text-teal-800 transition hover:border-teal-500 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
                        <FlaskConical size={16} />
                        Lab
                      </div>
                    </Link>
                  ))}
                  {mod.miniProject && (trail.status === 'building' ? (
                    <div className="flex cursor-not-allowed flex-col items-center gap-1 rounded-lg border-2 border bg-surface p-2 text-center text-xs font-bold text-muted opacity-60">
                      <Trophy size={16} />
                      Projeto
                    </div>
                  ) : (
                    <Link to={`/trilhas/${courseId}/modulo/${mod.id}/mini-projeto`}>
                      <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-purple-200 bg-purple-50 p-2 text-center text-xs font-bold text-purple-800 transition hover:border-purple-500 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-200">
                        <Trophy size={16} />
                        Projeto
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {trail.status !== 'building' && (
        <div className="mt-8">
          <Link to={`/trilhas/${courseId}/conclusao`}>
            <Button className="w-full">
              <Award size={18} />
              Ver conclusão da trilha
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      )}
    </div>
    </>
  )
}

function findLesson(lessonId) {
  return getLessonById(lessonId)
}
