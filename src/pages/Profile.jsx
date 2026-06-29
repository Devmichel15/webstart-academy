import { Award, Copy, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Badge } from '../components/ui/Badge'
import { ProfileSkeleton } from '../components/ui/Skeleton.jsx'
import { PlayerCard } from '../components/gamification/PlayerCard'
import { ShareButtons } from '../components/share/ShareButtons'
import { useProgress } from '../hooks/useProgress.js'
import { getPublicProfileUrl } from '../utils/username.js'
import { copyToClipboard } from '../utils/shareUtils.js'
import { useToast } from '../contexts/ToastContext.jsx'

export default function Profile() {
  const { showSuccess } = useToast()
  const {
    name,
    username,
    photoURL,
    email,
    xp,
    level,
    streak,
    completedCount,
    completedExercises,
    completedProjects,
    totalLessons,
    progressPercent,
    studyHours,
    journeyProgress,
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

  const allComplete = completedCount === totalLessons
  const unlockedBadges = achievements.filter((a) => a.unlocked)
  const latestBadge = unlockedBadges[unlockedBadges.length - 1]?.title
  const profileUrl = username ? getPublicProfileUrl(username) : null

  const handleCopyProfileLink = async () => {
    if (!profileUrl) return
    await copyToClipboard(profileUrl)
    showSuccess('Link do perfil copiado!')
  }

  return (
    <div>
      <Header
        title="Perfil do Jogador"
        subtitle="XP, níveis, badges e perfil público compartilhável."
      />

      <PlayerCard
        user={{
          name,
          level,
          xp,
          streak,
          completedCount,
          completedExercises: completedExercises || 0,
          completedProjects: completedProjects || 0,
          achievements: unlockedBadges,
          latestBadge,
          username,
        }}
        compact={false}
        showLink={Boolean(profileUrl)}
      />

      {profileUrl && (
        <Card className="mb-8 mt-6">
          <h2 className="mb-2 text-lg font-black">Perfil público</h2>
          <p className="mb-3 text-sm text-secondary">
            Partilha o teu player card e convida amigos para a WebStart.
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border-2 border bg-surface-hover p-3 text-sm font-semibold">
            <span className="flex-1 truncate">{profileUrl.replace(/^https?:\/\//, '')}</span>
            <button type="button" onClick={handleCopyProfileLink} className="rounded-lg p-2 hover:bg-surface">
              <Copy size={16} />
            </button>
            <Link to={`/u/${username}`} target="_blank" className="rounded-lg p-2 hover:bg-surface">
              <ExternalLink size={16} />
            </Link>
          </div>
          <ShareButtons
            shareData={{
              name: name || 'Aluno',
              title: `Perfil WebStart — Nível ${level}`,
              streak,
              level,
              badge: latestBadge,
              tagline: 'Dev em construção na WebStart Academy',
            }}
          />
        </Card>
      )}

      <Card className="mb-8 flex flex-wrap items-center gap-4">
        {photoURL ? (
          <img src={photoURL} alt={name} className="h-16 w-16 rounded-full border-3 border-brand-800 object-cover dark:border-brand-400" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-3 border-brand-800 bg-brand-500 text-2xl font-black text-white dark:border-brand-400">
            {(name || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-lg font-black">{email}</p>
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
            {studyHours}h estudadas · {journeyProgress?.completedCount || 0} trilha(s) concluída(s)
          </p>
        </div>
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
