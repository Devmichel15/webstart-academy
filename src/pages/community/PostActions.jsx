import { useCallback } from 'react'
import { Github, Heart, MessageCircle, Share2 } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext.jsx'

export function PostActions({
  project,
  liked = false,
  likePending = false,
  canLike = false,
  commentsOpen = false,
  onToggleLike,
  onToggleComments,
}) {
  const { showSuccess, showError } = useToast()

  const handleToggleLike = useCallback(() => {
    if (!canLike || likePending) return
    onToggleLike?.(project)
  }, [canLike, likePending, onToggleLike, project])

  const handleShare = useCallback(async () => {
    const url = project.projectUrl || project.githubUrl
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      showSuccess('Link copiado!')
    } catch {
      showError('Não foi possível copiar o link.')
    }
  }, [project.projectUrl, project.githubUrl, showSuccess, showError])

  const actionClass =
    'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-secondary transition-colors hover:bg-surface-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'

  return (
    <div className="mt-3 flex items-center gap-1">
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={!canLike || likePending}
        aria-label={liked ? 'Remover gosto' : 'Dar gosto'}
        aria-pressed={liked}
        className={`${actionClass} -ml-2 ${
          liked ? 'text-red-500 hover:bg-red-500/10 hover:text-red-500' : ''
        } ${!canLike || likePending ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        {project.likeCount ?? 0}
      </button>

      <button
        type="button"
        onClick={onToggleComments}
        aria-label="Comentar"
        aria-expanded={commentsOpen}
        className={`${actionClass} ${
          commentsOpen ? 'text-accent hover:bg-accent/10 hover:text-accent' : ''
        }`}
      >
        <MessageCircle size={16} />
        {project.commentCount ?? 0}
      </button>

      <div className="ml-auto flex items-center gap-1">
        {project.githubUrl && project.projectUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
            aria-label="Abrir no GitHub"
          >
            <Github size={16} />
          </a>
        )}

        <button
          type="button"
          onClick={handleShare}
          aria-label="Partilhar link do projeto"
          className={`${actionClass} -mr-2`}
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  )
}
