import { useCallback, useState } from 'react'
import { CommentsSection } from './CommentsSection.jsx'
import { PostBody } from './PostBody.jsx'
import { PostHeader } from './PostHeader.jsx'

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
  const [showComments, setShowComments] = useState(false)

  const toggleComments = useCallback(() => {
    setShowComments((prev) => !prev)
  }, [])

  const handleEdit = useCallback(() => {
    onEdit?.(project)
  }, [onEdit, project])

  const handleDelete = useCallback(() => {
    onDelete?.(project)
  }, [onDelete, project])

  return (
    <article className="w-full rounded-hard border border-border bg-surface p-4 shadow-hard hover-lift">
      <PostHeader
        author={author}
        createdAt={project.createdAt}
        isMine={isMine}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <PostBody
        project={project}
        liked={liked}
        likePending={likePending}
        canLike={Boolean(currentUser)}
        commentsOpen={showComments}
        onToggleLike={onToggleLike}
        onToggleComments={toggleComments}
        onTagClick={onTagClick}
      />

      {showComments && (
        <div className="mt-3">
          <CommentsSection
            projectId={project.id}
            currentUser={currentUser}
            onCountChange={(delta) => onCommentCountChange?.(project, delta)}
          />
        </div>
      )}
    </article>
  )
}
