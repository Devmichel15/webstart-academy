import { motion } from 'framer-motion'
import { SEO } from '../components/seo/SEO'
import { Header } from '../components/layout/Header'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { TrilhaBadgeCard } from '../components/TrilhaBadgeCard.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { getModuleData } from '../data/trails.js'
import { useEffect, useState } from 'react'

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

  const trailCards = orderedTrails.map((trail) => {
    const status = getTrailStatus(trail.id)
    const progress = getCourseProgress(trail.id)
    const modList = (trail.modules || []).map((mId) => getModuleData(mId)).filter(Boolean)
    const totalLessons = modList.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
    const completedInTrail = modList.reduce((sum, m) => sum + (m.lessons?.filter((lId) => isLessonCompleted(lId)).length || 0), 0)

    return { trail, status, progress, totalLessons, completedInTrail }
  })

  const accessibleCards = trailCards.filter((c) => c.trail.status !== 'soon')
  const soonCards = trailCards.filter((c) => c.trail.status === 'soon')

  return (
    <>
    <SEO title="Trilhas" description="Escolha sua trilha de aprendizado: HTML, CSS, JavaScript e muito mais. Aprenda desenvolvimento web passo a passo." url="/trilhas" keywords="trilhas, cursos, html, css, javascript, desenvolvimento web" />
    <div>
      <Header
        title="Sua Jornada"
        subtitle="Escolha qualquer trilha e comece a aprender. Todo o conteúdo está disponível desde o primeiro acesso."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {accessibleCards.map(({ trail, status, progress, totalLessons, completedInTrail }, index) => (
          <motion.div
            key={trail.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <TrilhaBadgeCard
              trail={trail}
              status={status}
              progress={progress}
              completedLessons={completedInTrail}
              totalLessons={totalLessons}
            />
          </motion.div>
        ))}
      </div>

      {soonCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: accessibleCards.length * 0.06 + 0.2 }}
          className="mt-10"
        >
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
            Em breve no roadmap
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {soonCards.map(({ trail }, index) => (
              <motion.div
                key={trail.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.06 }}
              >
                <TrilhaBadgeCard
                  trail={trail}
                  status="available"
                  progress={0}
                  completedLessons={0}
                  totalLessons={0}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
    </>
  )
}
