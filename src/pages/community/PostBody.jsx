import { useMemo } from 'react'
import { ExternalLink, Github, Link2 } from 'lucide-react'
import { normalizeTag } from '../../services/communityService.js'
import { PostImages } from './PostImages.jsx'
import { PostActions } from './PostActions.jsx'

function linkDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function PostBody({
  project,
  liked = false,
  likePending = false,
  canLike = false,
  commentsOpen = false,
  onToggleLike,
  onToggleComments,
  onTagClick,
}) {
  const tags = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const raw of project.tags || []) {
      const tag = normalizeTag(raw)
      if (!tag || seen.has(tag)) continue
      seen.add(tag)
      out.push(tag)
    }
    return out
  }, [project.tags])

  const imagePaths = project.imagePaths || []
  const hasImages = imagePaths.length > 0
  const linkUrl = project.projectUrl || project.githubUrl || ''

  const primaryAction = project.projectUrl
    ? { href: project.projectUrl, label: 'Ver projeto', Icon: ExternalLink }
    : project.githubUrl
      ? { href: project.githubUrl, label: 'Ver no GitHub', Icon: Github }
      : null

  return (
    <>
      {/* Bloco do projeto: sem background próprio (herda o do card), só a borda
          fina e o radius. Alinha com o padding do card — sem coluna de avatar. */}
      <div className="mt-3 rounded-lg border border-border bg-surface px-4 sm:px-5">
        <div className={`pt-3 ${hasImages ? 'pb-3' : ''}`}>
          <h2 className="break-words text-base font-black leading-snug text-primary sm:text-lg">
            {project.title}
          </h2>
          {project.description && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-secondary">
              {project.description}
            </p>
          )}
        </div>

        {hasImages ? (
          <PostImages imagePaths={imagePaths} title={project.title} />
        ) : (
          linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Link2 size={16} className="shrink-0" />
              <span className="truncate">{linkDomain(linkUrl)}</span>
            </a>
          )
        )}

        <div className="flex flex-wrap items-center gap-2 py-3">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick?.(tag)}
                  className="font-semibold text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {primaryAction && (
            <a
              href={primaryAction.href}
              target="_blank"
              rel="noopener noreferrer"
              className="brutal-btn brutal-btn-hard ml-auto mr-2 inline-flex items-center justify-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm font-bold text-primary"
            >
              <primaryAction.Icon size={14} />
              {primaryAction.label}
            </a>
          )}
        </div>
      </div>

      <PostActions
        project={project}
        liked={liked}
        likePending={likePending}
        canLike={canLike}
        commentsOpen={commentsOpen}
        onToggleLike={onToggleLike}
        onToggleComments={onToggleComments}
      />
    </>
  )
}
