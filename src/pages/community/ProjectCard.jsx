import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Flag, Github, Heart, Loader2, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { Card } from '../../components/ui/Card.jsx'
import { CommentsSection } from './CommentsSection.jsx'
import { AuthorAvatar } from './shared.jsx'
import { ReportModal } from './ReportModal.jsx'
import { useToast } from '../../contexts/ToastContext.jsx'
import { formatDatePt as formatPostDate } from '../../utils/formatDate.js'

export function ProjectCard({
  project,
  author,
  currentUser = null,
  isMine = false,
  liked = false,
  likePending = false,
  onToggleLike,
  onTagClick,
  onEdit,
  onDelete,
  onCommentCountChange,
}) {
  const [showComments, setShowComments] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const { showSuccess } = useToast()
  const name = (author?.name || '').trim() || 'Aluno WebStart'

  return (
    <Card hover className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <AuthorAvatar name={name} photoURL={author?.photoURL} />
          <div className="min-w-0">
            {author?.username ? (
              <Link to={`/u/${author.username}`} className="truncate text-sm font-bold text-primary hover:underline">
                {name}
              </Link>
            ) : (
              <p className="truncate text-sm font-bold text-primary">{name}</p>
            )}
            <p className="text-xs text-secondary">{formatPostDate(project.createdAt)}</p>
          </div>
        </div>
        {isMine && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Editar projeto"
              onClick={() => onEdit(project)}
              className="rounded-lg p-1.5 text-secondary hover:bg-surface-hover hover:text-primary"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              aria-label="Excluir projeto"
              onClick={() => onDelete(project)}
              className="rounded-lg p-1.5 text-secondary hover:bg-surface-hover hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <h3 className="mb-1.5 text-lg font-black leading-snug text-primary">{project.title}</h3>
      <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-secondary line-clamp-4">
        {project.description}
      </p>

      {project.tags?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              className="rounded-md border-2 border-strong bg-accent-soft px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:bg-brand-500 hover:text-white dark:bg-surface-hover"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap gap-2">
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="brutal-btn inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-bold text-white cursor-pointer hover:bg-brand-600"
            >
              Ver projeto <ExternalLink size={14} />
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="brutal-btn inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-sm font-bold text-primary cursor-pointer hover:bg-surface-hover dark:bg-surface dark:text-primary"
            >
              GitHub <Github size={14} />
            </a>
          )}
        </div>

        <div className="flex items-center justify-between border-t-2 border-strong pt-3">
          <button
            type="button"
            onClick={() => onToggleLike(project)}
            disabled={likePending}
            aria-pressed={liked}
            aria-label={liked ? 'Remover like' : 'Curtir projeto'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold cursor-pointer transition-colors disabled:opacity-50 ${
              liked ? 'text-red-500' : 'text-secondary hover:text-red-500'
            }`}
          >
            {likePending ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} fill={liked ? 'currentColor' : 'none'} />}
            {project.likeCount ?? 0}
          </button>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            aria-expanded={showComments}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold text-secondary cursor-pointer hover:text-primary"
          >
            <MessageCircle size={16} />
            {project.commentCount ?? 0}
          </button>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            aria-label="Denunciar projeto"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold text-secondary cursor-pointer hover:text-red-500"
          >
            <Flag size={16} />
          </button>
        </div>

        {showComments && (
          <CommentsSection
            projectId={project.id}
            currentUser={currentUser}
            onCountChange={(delta) => onCommentCountChange(project, delta)}
          />
        )}

        <ReportModal
          open={reportOpen}
          projectId={project.id}
          onClose={() => setReportOpen(false)}
          onReported={() => {
            setReportOpen(false)
            showSuccess('Denúncia enviada. Obrigado por ajudar a manter o feed seguro!')
          }}
        />
      </div>
    </Card>
  )
}
