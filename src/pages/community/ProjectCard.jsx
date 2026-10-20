import { Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Github,
  User,
} from 'lucide-react'
import { Card } from '../../components/ui/Card.jsx'
import { CommentsSection } from './CommentsSection.jsx'
import { PostImages } from './PostImages.jsx'
import { formatPostDate } from '../../utils/formatDate.js'

const TAG_LIMIT = 4

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
  const [menuOpen, setMenuOpen] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const authorName = author?.name || author?.username || 'Aluno'
  const authorAvatar = author?.photo_url || author?.photoURL
  const authorUsername = author?.username

  const tags = project.tags || []
  const visibleTags = tags.slice(0, TAG_LIMIT)
  const extraTags = tags.length - visibleTags.length
  const imagePaths = project.imagePaths || []

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

  const likeAria = liked ? 'Remover gosto' : 'Dar gosto'
  const likeDisabled = !currentUser || likePending

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {authorAvatar ? (
            authorUsername ? (
              <Link to={`/u/${authorUsername}`}>
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="h-10 w-10 rounded-full border-2 border-strong object-cover"
                />
              </Link>
            ) : (
              <img
                src={authorAvatar}
                alt={authorName}
                className="h-10 w-10 rounded-full border-2 border-strong object-cover"
              />
            )
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-strong bg-accent-soft">
              <User size={18} className="text-secondary" />
            </div>
          )}
          <div className="min-w-0">
            {authorUsername ? (
              <Link to={`/u/${authorUsername}`} className="truncate font-bold text-primary hover:underline">
                {authorName}
              </Link>
            ) : (
              <p className="truncate font-bold text-primary">{authorName}</p>
            )}
            <p className="text-xs text-secondary">{formatPostDate(project.createdAt)}</p>
          </div>
        </div>
        {isMine && (
          <div className="relative" data-card-menu>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-lg p-1.5 text-secondary hover:bg-surface-hover hover:text-primary"
              aria-label="Opções do projeto"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border-2 border-strong bg-surface shadow-lg">
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

      <div className="flex-1 px-4">
        <h2 className="mb-2 font-black text-primary">{project.title}</h2>
        {project.description && (
          <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-secondary">
            {project.description}
          </p>
        )}
        {imagePaths.length > 0 && <PostImages imagePaths={imagePaths} title={project.title} />}
        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={handleTagClick(tag)}
                className="rounded-full border-2 border-strong bg-accent-soft px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-primary transition hover:bg-surface dark:bg-surface"
              >
                #{tag}
              </button>
            ))}
            {extraTags > 0 && (
              <span className="rounded-full border-2 border-strong bg-accent-soft px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-secondary dark:bg-surface">
                +{extraTags}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="mb-3 flex items-center gap-3 text-sm text-secondary">
          <button
            type="button"
            onClick={toggleLike}
            disabled={likeDisabled}
            className={`inline-flex items-center gap-1.5 font-semibold transition ${
              liked ? 'text-red-500' : 'hover:text-red-500'
            } ${likeDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
            aria-label={likeAria}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} /> {project.likeCount ?? 0}
          </button>
          <button
            type="button"
            onClick={toggleComments}
            className="inline-flex items-center gap-1.5 font-semibold hover:text-primary"
          >
            <MessageCircle size={18} /> {project.commentCount ?? 0}
          </button>
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 font-semibold hover:text-primary"
            >
              <ExternalLink size={16} /> Ver projeto
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold hover:text-primary"
            >
              <Github size={16} /> GitHub
            </a>
          )}
        </div>

        {showComments && (
          <CommentsSection projectId={project.id} currentUser={currentUser} onCountChange={(delta) => onCommentCountChange?.(project, delta)} />
        )}
      </div>
    </Card>
  )
}
