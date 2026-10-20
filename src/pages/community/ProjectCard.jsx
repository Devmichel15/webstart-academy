import { Link } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Github,
  Link2,
  Share2,
  User,
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext.jsx'
import { CommentsSection } from './CommentsSection.jsx'
import { PostImages } from './PostImages.jsx'
import { formatPostDateShort } from '../../utils/formatDate.js'

function linkDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function ProjectCard({
  project,
  author,
  currentUser,
  isMine,
  liked,
  likePending,
  onToggleLike,
  onTagClick,
  onEdit,
  onDelete,
  onCommentCountChange,
}) {
  const { showSuccess, showError } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const authorName = author?.name || author?.username || 'Aluno'
  const authorAvatar = author?.photo_url || author?.photoURL
  const authorUsername = author?.username

  const tags = useMemo(() => [...new Set(project.tags || [])], [project.tags])
  const imagePaths = project.imagePaths || []
  const hasImages = imagePaths.length > 0
  const linkUrl = project.projectUrl || project.githubUrl || ''

  useEffect(() => {
    if (!menuOpen) return undefined
    const handle = (e) => {
      if (!e.target.closest('[data-card-menu]')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  const toggleLike = useCallback(() => {
    onToggleLike?.(project)
  }, [onToggleLike, project])

  const toggleComments = useCallback(() => {
    setShowComments((prev) => !prev)
  }, [])

  const handleEdit = useCallback(() => {
    setMenuOpen(false)
    onEdit?.(project)
  }, [onEdit, project])

  const handleDelete = useCallback(() => {
    setMenuOpen(false)
    onDelete?.(project)
  }, [onDelete, project])

  const handleTagClick = useCallback(
    (tag) => (e) => {
      e.preventDefault()
      onTagClick?.(tag)
    },
    [onTagClick],
  )

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

  const likeAria = liked ? 'Remover gosto' : 'Dar gosto'
  const likeDisabled = !currentUser || likePending

  return (
    <article className="flex gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-hover">
      {authorAvatar ? (
        authorUsername ? (
          <Link to={`/u/${authorUsername}`} className="shrink-0">
            <img
              src={authorAvatar}
              alt={authorName}
              className="h-11 w-11 rounded-full border-2 border-border object-cover"
            />
          </Link>
        ) : (
          <img
            src={authorAvatar}
            alt={authorName}
            className="h-11 w-11 shrink-0 rounded-full border-2 border-border object-cover"
          />
        )
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-border bg-accent-soft">
          <User size={18} className="text-secondary" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline gap-1.5 text-sm">
          {authorUsername ? (
            <Link to={`/u/${authorUsername}`} className="truncate font-bold text-primary hover:underline">
              {authorName}
            </Link>
          ) : (
            <p className="truncate font-bold text-primary">{authorName}</p>
          )}
          <span className="min-w-0 truncate text-secondary">
            {authorUsername && <span>@{authorUsername} · </span>}
            {formatPostDateShort(project.createdAt)}
          </span>
          {isMine && (
            <div className="relative ml-auto shrink-0" data-card-menu>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="-mr-1 rounded-full p-1 text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
                aria-label="Opções do projeto"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-20 w-40 overflow-hidden rounded-xl border-2 border-strong bg-elevated shadow-lg">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-hover"
                  >
                    <Edit size={16} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-surface-hover"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <h2 className="mt-0.5 font-bold leading-snug text-primary">{project.title}</h2>

        {project.description && (
          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-secondary">
            {project.description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-sm">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={handleTagClick(tag)}
                className="font-semibold text-accent transition-colors hover:underline"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {hasImages ? (
          <div className="mt-3">
            <PostImages imagePaths={imagePaths} title={project.title} />
          </div>
        ) : (
          linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-3 rounded-2xl border border-border px-3 py-3 transition-colors hover:bg-surface-hover"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Link2 size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-primary">{linkDomain(linkUrl)}</span>
                <span className="block truncate text-xs text-secondary">Abrir projeto</span>
              </span>
              <ExternalLink size={14} className="shrink-0 text-secondary" />
            </a>
          )
        )}

        <div className="mt-2 flex -mr-2 items-center justify-between text-secondary">
          <button
            type="button"
            onClick={toggleComments}
            className={`-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
              showComments ? 'text-accent hover:bg-accent/10' : 'hover:bg-accent/10 hover:text-accent'
            }`}
            aria-label="Comentar"
            aria-expanded={showComments}
          >
            <MessageCircle size={16} /> {project.commentCount ?? 0}
          </button>
          <button
            type="button"
            onClick={toggleLike}
            disabled={likeDisabled}
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
              liked ? 'text-red-500' : 'hover:bg-red-500/10 hover:text-red-500'
            } ${likeDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
            aria-label={likeAria}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {project.likeCount ?? 0}
          </button>
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition-colors hover:bg-accent/10 hover:text-accent"
            >
              <ExternalLink size={16} /> Ver projeto
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition-colors hover:bg-accent/10 hover:text-accent"
            >
              <Github size={16} /> GitHub
            </a>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="-mr-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition-colors hover:bg-accent/10 hover:text-accent"
            aria-label="Partilhar link do projeto"
          >
            <Share2 size={16} />
          </button>
        </div>

        {showComments && (
          <CommentsSection
            projectId={project.id}
            currentUser={currentUser}
            onCountChange={(delta) => onCommentCountChange?.(project, delta)}
          />
        )}
      </div>
    </article>
  )
}
