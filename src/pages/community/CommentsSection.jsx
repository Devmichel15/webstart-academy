import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, User } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext.jsx'
import { addComment, getComments, hydrateAuthors } from '../../services/communityService.js'
import { formatPostDate } from '../../utils/formatDate.js'
import { toUserMessage } from '../../utils/errors.js'

export function CommentsSection({ projectId, currentUser, onCountChange }) {
  const { showError } = useToast()
  const [comments, setComments] = useState([])
  const [authors, setAuthors] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const listRef = useRef(null)

  const loadComments = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const { comments } = await getComments({ projectId })
      setComments(comments)
      const hydrated = await hydrateAuthors(comments)
      setAuthors(hydrated)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser || !text.trim() || submitting) return
    const payload = text.trim()
    setSubmitting(true)
    try {
      const created = await addComment(projectId, currentUser.id, payload)
      setComments((current) => [created, ...current])
      const hydrated = await hydrateAuthors([created])
      setAuthors((current) => ({ ...current, ...hydrated }))
      setText('')
      onCountChange?.(1)
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      })
    } catch (err) {
      showError(toUserMessage(err, 'Não foi possível publicar o comentário.'))
    } finally {
      setSubmitting(false)
    }
  }

  const renderAuthor = (authorId) => {
    const a = authors[authorId]
    const name = a?.name || a?.username || 'Aluno'
    const avatar = a?.photo_url || a?.photoURL
    const username = a?.username
    return (
      <div className="flex min-w-0 items-center gap-2">
        {avatar ? (
          <img src={avatar} alt={name} className="h-8 w-8 rounded-full border-2 border-strong object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-strong bg-accent-soft">
            <User size={16} className="text-secondary" />
          </div>
        )}
        <div className="min-w-0">
          {username ? (
            <Link to={`/u/${username}`} className="truncate text-sm font-bold text-primary hover:underline">
              {name}
            </Link>
          ) : (
            <p className="truncate text-sm font-bold text-primary">{name}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 border-t border-strong pt-3">
      {currentUser && (
        <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreve um comentário..."
            rows={2}
            maxLength={500}
            className="flex-1 resize-none rounded-lg border-2 border-strong bg-surface px-3 py-2 text-sm text-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="flex items-center justify-center rounded-lg border-2 border-brand-800 bg-brand-500 px-3 text-sm font-black text-white shadow-[2px_2px_0_0_#064e3b] transition hover:bg-brand-600 disabled:opacity-60 dark:border-brand-400"
          >
            {submitting ? '...' : <Send size={16} />}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-secondary">A carregar comentários...</p>}
      {error && (
        <button type="button" onClick={loadComments} className="text-sm font-bold text-brand-600 dark:text-brand-300">
          Tentar novamente
        </button>
      )}
      {!loading && !error && comments.length === 0 && (
        <p className="text-sm text-secondary">Ainda não há comentários. Sê o primeiro a responder!</p>
      )}
      {!loading && !error && comments.length > 0 && (
        <ul ref={listRef} className="max-h-60 space-y-3 overflow-y-auto pr-1">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border-2 border-strong bg-surface-hover p-2">
              <div className="flex items-start justify-between gap-2">
                {renderAuthor(c.authorId)}
                <span className="text-[11px] text-secondary">{formatPostDate(c.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-primary">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
