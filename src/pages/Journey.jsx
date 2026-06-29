import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SEO } from '../components/seo/SEO'
import { ArrowRight, Code2, Globe, Palette, FileJson, BookOpen, GraduationCap, Lock, CheckCircle2, GitBranch, Atom, Terminal, Database, Link2, Cloud, Clock, Sparkles } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { getModuleData } from '../data/trails.js'
import { useEffect, useState } from 'react'

const trailIcons = {
  'fundamentos-web': Globe,
  html: Code2,
  css: Palette,
  javascript: FileJson,
  'git-github': GitBranch,
  react: Atom,
  backend: Terminal,
  database: Database,
  apis: Link2,
  deploy: Cloud,
}

const statusConfig = {
  locked: { label: 'Bloqueado', color: 'border-muted bg-surface text-muted', icon: Lock },
  available: { label: 'Disponível', color: 'border-strong bg-accent-soft text-secondary', icon: Sparkles },
  in_progress: { label: 'Em andamento', color: 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
  completed: { label: 'Concluído', color: 'border-accent bg-accent-soft text-green-600', icon: CheckCircle2 },
}

export default function Journey() {
  const { getCourseProgress, isLessonCompleted, getTrailStatus, trails: allTrails } = useProgress()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div>
        <Header title="Jornada" subtitle="Carregando..." />
        <PageSkeleton />
      </div>
    )
  }

  const trailsList = allTrails || []
  const orderedTrails = [...trailsList].sort((a, b) => a.order - b.order)

  const getTrailTitle = (id) => trailsList.find((t) => t.id === id)?.title || id

  return (
    <>
    <SEO title="Trilhas" description="Escolha sua trilha de aprendizado: HTML, CSS, JavaScript e muito mais. Aprenda desenvolvimento web passo a passo." url="/trilhas" keywords="trilhas, cursos, html, css, javascript, desenvolvimento web" />
    <div>
      <Header
        title="Sua Jornada"
        subtitle="Siga a rota linear para se tornar um desenvolvedor web completo. Cada trilha desbloqueia a próxima."
      />

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-border hidden md:block" />

        <div className="space-y-6">
          {orderedTrails.map((trail, tIndex) => {
            const Icon = trailIcons[trail.id] || BookOpen
            const status = getTrailStatus(trail.id)
            const displayStatus = trail.status === 'soon' ? 'soon' : status
            const cfg = displayStatus === 'soon'
              ? { label: 'Em breve', color: 'border-muted bg-surface text-muted', icon: Clock }
              : statusConfig[status] || statusConfig.locked
            const StatusIcon = cfg.icon
            const progress = getCourseProgress(trail.id)
            const modList = (trail.modules || []).map((mId) => getModuleData(mId)).filter(Boolean)
            const totalLessons = modList.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
            const completedInTrail = modList.reduce((sum, m) => sum + (m.lessons?.filter((lId) => isLessonCompleted(lId)).length || 0), 0)

            return (
              <motion.div
                key={trail.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: tIndex * 0.08 }}
                className="relative"
              >
                <div className="hidden md:flex absolute left-0 top-6 items-center justify-center">
                  <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-3 transition-all ${
                    status === 'completed'
                      ? 'border-green-500 bg-green-500 text-white'
                      : status === 'in_progress'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : status === 'locked'
                          ? 'border-muted bg-surface text-muted'
                          : 'border-strong bg-brand-500 text-white'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle2 size={14} />
                    ) : status === 'locked' ? (
                      <Lock size={14} />
                    ) : (
                      <span className="text-xs font-black">{tIndex + 1}</span>
                    )}
                  </div>
                </div>

                <div className="md:ml-16">
                  {(() => {
                    const Wrapper = status === 'completed' ? 'div' : Link
                    const wrapperProps = status === 'completed'
                      ? { className: 'block' }
                      : { to: status === 'locked' ? '#' : `/trilhas/${trail.id}`,
                          className: `block ${status === 'locked' ? 'pointer-events-none' : ''}`,
                          onClick: (e) => { if (status === 'locked') e.preventDefault() } }
                    return (
                      <Wrapper {...wrapperProps}>
                        <Card hover={status !== 'locked'} className={`h-full transition-all ${
                          status === 'locked' ? 'opacity-60' : ''
                        }`}>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-3 ${
                                status === 'completed'
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : trail.status === 'soon'
                                    ? 'border-muted bg-surface text-muted'
                                    : status === 'locked'
                                      ? 'border-muted bg-surface text-muted'
                                      : 'border-strong bg-brand-500 text-white shadow-[4px_4px_0_0_#064e3b]'
                              }`}>
                                {trail.status === 'soon' ? <Clock size={28} /> : status === 'locked' ? <Lock size={28} /> : <Icon size={28} />}
                              </div>

                              <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <h2 className={`text-xl font-black ${
                                    status === 'locked' ? 'text-muted' : ''
                                  }`}>
                                    {trail.title}
                                  </h2>
                                  <span className={`inline-flex items-center gap-1 rounded-lg border-2 px-2 py-0.5 text-xs font-bold ${cfg.color}`}>
                                    <StatusIcon size={12} />
                                    {cfg.label}
                                  </span>
                                  {trail.status === 'building' && (
                                    <span className="rounded-lg border-2 border-yellow-500 px-2 py-0.5 text-xs font-bold text-yellow-600 dark:border-yellow-400 dark:text-yellow-300">
                                      Em construção
                                    </span>
                                  )}
                                  {trail.isPremium && (
                                    <span className="rounded-lg border-2 border-amber-500 px-2 py-0.5 text-xs font-bold text-amber-600 dark:border-amber-400 dark:text-amber-300">
                                      Premium
                                    </span>
                                  )}
                                  {trail.status === 'soon' && (
                                    <span className="rounded-lg border-2 border-muted px-2 py-0.5 text-xs font-bold text-muted">
                                      Em breve
                                    </span>
                                  )}
                                </div>

                                <p className={`text-sm ${
                                  status === 'locked'
                                    ? 'text-muted'
                                    : 'text-secondary'
                                }`}>
                                  {trail.description}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {!status === 'locked' && (
                                    <>
                                      <Badge variant={trail.difficulty === 'beginner' ? 'default' : trail.difficulty === 'intermediate' ? 'warning' : 'danger'}>
                                        {trail.difficulty === 'beginner' ? 'Iniciante' : trail.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                                      </Badge>
                                      <Badge variant="success">{trail.estimatedHours}h</Badge>
                                      <Badge>Nível {trail.level}</Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="sm:text-right shrink-0">
                              {trail.status === 'soon' && (
                                <p className="text-xs font-semibold text-muted">
                                  Em desenvolvimento
                                </p>
                              )}
                              {status === 'locked' && trail.status !== 'soon' && trail.requiredTrail && (
                                <p className="text-xs font-semibold text-muted">
                                  Complete {getTrailTitle(trail.requiredTrail)} para desbloquear
                                </p>
                              )}
                            </div>
                          </div>

                          {status !== 'locked' && totalLessons > 0 && (
                            <div className="mt-4">
                              <ProgressBar
                                value={progress}
                                label={`${completedInTrail}/${totalLessons} aulas`}
                              />
                            </div>
                          )}

                          {status !== 'locked' && status !== 'completed' && trail.status === 'available' && (
                            <div className="mt-4">
                              <Button>
                                {status === 'in_progress' ? 'Continuar trilha' : 'Explorar trilha'}
                                <ArrowRight size={16} />
                              </Button>
                            </div>
                          )}

                          {status === 'completed' && (
                            <div className="mt-4">
                              <Link to={`/trilhas/${trail.id}/conclusao`}>
                                <Button variant="secondary">
                                  Ver certificado
                                  <ArrowRight size={16} />
                                </Button>
                              </Link>
                            </div>
                          )}
                        </Card>
                      </Wrapper>
                    )
                  })()}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
    </>
  )
}
