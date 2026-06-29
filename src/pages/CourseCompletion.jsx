import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, CheckCircle2, GraduationCap, ListChecks, Target, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { SEO } from '../components/seo/SEO'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ShareButtons } from '../components/share/ShareButtons'
import { getTrailById } from '../data/trails.js'
import { useProgress } from '../hooks/useProgress.js'

export default function CourseCompletion() {
  const { courseId } = useParams()
  const trail = getTrailById(courseId)
  const course = trail
  const { getCourseProgress, name, level, streak, achievements } = useProgress()

  if (!course) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black">Trilha não encontrada</h1>
        <Link to="/trilhas" className="mt-4 inline-block font-bold text-brand-600 underline">Voltar às trilhas</Link>
      </div>
    )
  }

  const progress = getCourseProgress(courseId)
  const modules = course.modules || []
  const completion = course.completion
  const latestBadge = achievements.filter((a) => a.unlocked).pop()?.title

  const shareData = progress >= 100 ? {
    name: name || 'Aluno',
    title: `Trilha concluída: ${course.title}`,
    xpEarned: 1000,
    streak,
    level,
    badge: latestBadge || 'WebStart Graduate',
    tagline: 'Dev em construção — trilha completa!',
  } : null

  return (
    <>
    <SEO title="Curso Concluído" description="Parabéns! Você concluiu um curso na WebStart Academy. Veja suas conquistas e compartilhe seu progresso." />
    <div>
      <Link to={`/trilhas/${courseId}`} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
        <ArrowLeft size={16} />
        Voltar para {course.title}
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-2xl border-3 border-brand-800 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-[6px_6px_0_0_#064e3b] dark:border-brand-400 dark:shadow-[6px_6px_0_0_#34d399]"
      >
        <Badge className="mb-3 !border-white/30 !bg-white/20 !text-white">Conclusão</Badge>
        <h1 className="mb-2 text-2xl font-black md:text-3xl">{course.title}</h1>
        <p className="text-brand-100">Complete a trilha e receba seu certificado</p>
      </motion.section>

      <div className="mb-4 h-2 overflow-hidden rounded-full border-2 border-brand-800 bg-brand-100 dark:bg-brand-900">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mb-6 text-sm font-bold text-brand-600">{progress}% completo</p>

      {shareData && (
        <Card className="mb-6">
          <h2 className="mb-2 text-lg font-black">Partilhar conclusão da trilha</h2>
          <p className="mb-4 text-sm text-secondary">Mostra ao mundo que completaste esta trilha!</p>
          <ShareButtons shareData={shareData} />
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {completion?.finalProject && (
          <Card className="!border-emerald-500 dark:!border-emerald-400">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[3px_3px_0_0_#065f46]">
                <Trophy size={20} />
              </div>
              <h2 className="text-lg font-black">Projeto Final</h2>
            </div>
            <h3 className="mb-2 font-bold">{completion.finalProject.title}</h3>
            <p className="mb-3 text-sm text-brand-700 dark:text-brand-300">{completion.finalProject.description}</p>
            {completion.finalProject.requirements && (
              <ul className="mb-4 space-y-1">
                {completion.finalProject.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-brand-500" />
                    {req}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {completion?.finalEvaluation && (
          <Card className="!border-violet-500 dark:!border-violet-400">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[3px_3px_0_0_#4c1d95]">
                <Target size={20} />
              </div>
              <h2 className="text-lg font-black">Avaliação Final</h2>
            </div>
            <p className="mb-3 text-sm text-brand-700 dark:text-brand-300">Revise os conceitos fundamentais da trilha.</p>
            {completion.finalEvaluation.questions && (
              <ul className="space-y-2">
                {completion.finalEvaluation.questions.map((q, i) => (
                  <li key={i} className="rounded-lg border-2 border-brand-200 p-2 text-sm dark:border-brand-700">
                    <p className="font-bold">{q.question}</p>
                    {q.answer && <p className="mt-1 text-brand-600">{q.answer}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {completion?.certificate && (
          <Card className="!border-amber-500 dark:!border-amber-400">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-[3px_3px_0_0_#92400e]">
                <Award size={20} />
              </div>
              <h2 className="text-lg font-black">Certificado</h2>
            </div>
            <h3 className="mb-2 font-bold">{completion.certificate.title}</h3>
            <p className="mb-4 text-sm text-brand-700 dark:text-brand-300">{completion.certificate.description}</p>
            <Badge variant={progress >= 100 ? 'success' : 'warning'}>
              {progress >= 100 ? 'Disponível' : 'Complete a trilha para desbloquear'}
            </Badge>
          </Card>
        )}

        {completion?.nextSteps && completion.nextSteps.recommendations?.length > 0 && (
          <Card className="!border-blue-500 dark:!border-blue-400">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[3px_3px_0_0_#1e40af]">
                <GraduationCap size={20} />
              </div>
              <h2 className="text-lg font-black">Próximos Passos</h2>
            </div>
            <ul className="space-y-2">
              {completion.nextSteps.recommendations.map((rec, i) => (
                <li key={i}>
                  {rec.courseId ? (
                    <Link to={`/trilhas/${rec.courseId}`} className="flex items-center gap-2 rounded-lg border-2 border-brand-200 p-2 text-sm font-semibold text-brand-700 transition hover:border-brand-500 dark:border-brand-700 dark:text-brand-300">
                      <ArrowLeft size={14} className="rotate-180" />
                      {rec.label}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border-2 border-brand-200 p-2 text-sm dark:border-brand-700">
                      <ListChecks size={14} className="text-brand-500" />
                      {rec.label}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {modules.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-black">Módulos da Trilha</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((modId, i) => (
              <Link key={modId} to={`/trilhas/${courseId}/modulo/${modId}`}>
                <Card hover className="text-center">
                  <span className="text-2xl font-black text-brand-600">{i + 1}</span>
                  <p className="text-sm font-bold">{modId.replace(`${courseId}-`, '').replace(/-/g, ' ')}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  )
}
