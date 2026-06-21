import { Award, Flame, Sparkles, Trophy } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Badge } from '../components/ui/Badge'
import { ProfileSkeleton } from '../components/ui/Skeleton.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { getXpForNextLevel } from '../utils/xp.js'

export default function Profile() {
  const {
    name,
    photoURL,
    email,
    xp,
    level,
    streak,
    completedCount,
    totalLessons,
    progressPercent,
    studyHours,
    completedCourses,
    certificates,
    achievements,
    loading,
  } = useProgress()

  if (loading) {
    return (
      <div>
        <Header title="Perfil do Aluno" subtitle="Carregando perfil..." />
        <ProfileSkeleton />
      </div>
    )
  }

  const xpInfo = getXpForNextLevel(xp)
  const allComplete = completedCount === totalLessons

  return (
    <div>
      <Header
        title="Perfil do Aluno"
        subtitle="XP, níveis, medalhas e certificados sincronizados na nuvem."
      />

      <Card className="mb-8 flex flex-wrap items-center gap-4">
        {photoURL ? (
          <img src={photoURL} alt={name} className="h-20 w-20 rounded-full border-3 border-brand-800 object-cover dark:border-brand-400" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-3 border-brand-800 bg-brand-500 text-3xl font-black text-white dark:border-brand-400">
            {(name || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-2xl font-black">{name || 'Aluno WebStart'}</p>
          <p className="text-sm text-brand-600">{email}</p>
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
            {studyHours}h estudadas · {completedCourses.length} curso(s) concluído(s)
          </p>
        </div>
      </Card>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <Sparkles className="mx-auto mb-2 text-brand-500" size={28} />
          <p className="text-sm font-semibold text-brand-600">Nível</p>
          <p className="text-4xl font-black">{level}</p>
        </Card>
        <Card className="text-center">
          <Trophy className="mx-auto mb-2 text-brand-500" size={28} />
          <p className="text-sm font-semibold text-brand-600">XP Total</p>
          <p className="text-4xl font-black">{xp}</p>
        </Card>
        <Card className="text-center">
          <Flame className="mx-auto mb-2 text-amber-500" size={28} />
          <p className="text-sm font-semibold text-brand-600">Streak</p>
          <p className="text-4xl font-black">{streak} dias</p>
        </Card>
      </div>

      <Card className="mb-8">
        <ProgressBar
          value={xpInfo.percent}
          label={`Progresso para nível ${level + 1} (${xpInfo.current}/${xpInfo.needed} XP)`}
        />
      </Card>

      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-black">Progresso geral</h2>
        <ProgressBar value={progressPercent} label={`${completedCount}/${totalLessons} aulas concluídas`} />
      </Card>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-black">Medalhas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`flex items-start gap-3 rounded-xl border-3 p-4 ${
                achievement.unlocked
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900'
                  : 'border-brand-200 opacity-40 dark:border-brand-800'
              }`}
            >
              <Award className={achievement.unlocked ? 'text-brand-500' : 'text-brand-300'} size={24} />
              <div>
                <p className="font-black">{achievement.title}</p>
                <p className="text-sm text-brand-700 dark:text-brand-300">{achievement.description}</p>
                {achievement.unlocked && <Badge className="mt-2">Desbloqueada</Badge>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {(allComplete || certificates.length > 0) && (
        <Card className="border-brand-500 bg-gradient-to-br from-brand-100 to-brand-200 text-center dark:from-brand-900 dark:to-brand-950">
          <Award className="mx-auto mb-4 text-brand-600" size={48} />
          <h2 className="mb-2 text-2xl font-black">Certificados WebStart</h2>
          <p className="mb-4 text-brand-800 dark:text-brand-200">
            Seus certificados emitidos e salvos no Firestore.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {(certificates.length ? certificates : [{ courseName: 'HTML5 & CSS3 — Formação Completa', issuedAt: new Date().toISOString() }]).map((cert) => (
              <div key={cert.courseId || cert.courseName} className="rounded-xl border-3 border-brand-800 bg-white p-6 dark:border-brand-400 dark:bg-brand-950">
                <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Certificado de Conclusão</p>
                <p className="my-2 text-xl font-black">WebStart Academy</p>
                <p className="text-sm">{cert.courseName}</p>
                <p className="mt-4 text-xs text-brand-600">
                  {new Date(cert.issuedAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
