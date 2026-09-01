import { Copy, ExternalLink, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/seo/SEO'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ProfileSkeleton } from '../components/ui/Skeleton.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { ProfileProjectsSection } from './community/ProfileProjectsSection.jsx'
import { getPublicProfileUrl } from '../utils/username.js'
import { copyToClipboard } from '../utils/clipboard.js'
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

  const profileUrl = username ? getPublicProfileUrl(username) : null

  const handleCopyProfileLink = async () => {
    if (!profileUrl) return
    await copyToClipboard(profileUrl)
    showSuccess('Link do perfil copiado!')
  }

  return (
    <>
    <SEO title="Meu Perfil" description="Seu perfil na WebStart Academy: XP, badges, conquistas e estatísticas de aprendizado." url="/perfil" keywords="perfil, jogador, xp, badges, conquistas" />
    <div>
      <Header
        title="Perfil do Jogador"
        subtitle="XP, níveis e perfil público compartilhável."
      />

      <div className="mb-6">
        <Link
          to="/editar-perfil"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-800 bg-brand-500 px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_0_#064e3b] transition hover:bg-brand-600 dark:border-brand-400"
        >
          <Pencil size={14} />
          Editar perfil
        </Link>
      </div>

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

      <ProfileProjectsSection />
    </div>
    </>
  )
}
