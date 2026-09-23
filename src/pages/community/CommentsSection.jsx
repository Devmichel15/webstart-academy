import { useEffect, useState } from 'react'
import { Flag, Loader2, Pencil, Trash2, X } from 'lucide-react'
import {
  COMMENT_MAX,
  addComment,
  deleteComment as deleteCommentService,
  getComments,
  hydrateAuthors,
  updateComment as updateCommentService,
} from '../../services/communityService.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import { AuthorAvatar } from './shared.jsx'
import { ReportModal } from './ReportModal.jsx'
import { formatDatePt as formatPostDate } from '../../utils/formatDate.js'
import { toUserMessage } from '../../utils/errors.js'

function authorIdentityFromUser(user) {
  const meta = (user && user.user_metadata) || {}
  return {
    name: (meta.name || meta.full_name || '').trim(),
    photoURL: meta.avatar_url || meta.picture || '',
  }
}

export function CommentsSection({ projectId, currentUser, onCountChange }) {
  const { showSuccess, showError } = useToast()
  const [comments, setComments] = useState([])
  const [authors, setAuthors] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [reportComment, setReportComment] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getComments({ projectId })
      .then(async ({ comments: list }) => {
        if (!active) return
        setComments(list)
        setAuthors(await hydrateAuthors(list))
      })
      .catch(() => active && setError('Não foi possível carregar os comentários.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [projectId])

  const handleAdd = async () => {
    const content = newComment.trim()
    if (!content || submitting) return
    setSubmitting(true)
    try {
      const created = await addComment(projectId, currentUser.id, content)
      setComments((current) => [...current, created])
      const identity = authorIdentityFromUser(currentUser)
      setAuthors((current) => ({
        ...current,
        [currentUser.id]: current[currentUser.id] || {
          name: identity.name || 'Aluno WebStart',
          username: '',
          photoURL: identity.photoURL,
        },
      }))
      setNewComment('')
      onCountChange?.(1)
    } catch (err) {
      showError(toUserMessage(err, 'Não foi possível publicar o comentário.'))
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (comment) => {
    setEditingId(comment.id)
    setEditText(comment.content)
  }

  const handleSaveEdit = async () => {
    if (savingEdit) return
    setSavingEdit(true)
    try {
      await updateCommentService(editingId, editText)
      setComments((current) =>
        current.map((c) => (c.id === editingId ? { ...c, content: editText.trim() } : c)),
      )
      setEditingId(null)
      showSuccess('Comentário atualizado!')
    } catch (err) {
      showError(toUserMessage(err, 'Não foi possível atualizar o comentário.'))
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete || deleting) return
    setDeleting(true)
    try {
      await deleteCommentService(pendingDelete.id)
      setComments((current) => current.filter((c) => c.id !== pendingDelete.id))
      onCountChange?.(-1)
      showSuccess('Comentário excluído.')
    } catch (err) {
      showError(toUserMessage(err, 'Não foi possível excluir o comentário.'))
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  const inputClass =
    'w-full rounded-lg border-3 border-brand-800 bg-white px-3 py-2 text-sm text-black dark:border-brand-400 dark:bg-brand-950 dark:text-primary'

  return (
    <div className="space-y-3 rounded-lg border-2 border-strong bg-surface-hover p-3 dark:bg-surface">
      <p className="text-xs font-black uppercase tracking-wide text-secondary">Comentários</p>

      {currentUser && (
        <div className="space-y-2">
          <textarea
            rows={2}
            maxLength={COMMENT_MAX}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Deixa um comentário construtivo..."
            className={`${inputClass} resize-y`}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={submitting || !newComment.trim()}
              className="brutal-btn inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-bold text-white cursor-pointer hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Comentar
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-2 text-sm text-secondary">
          <Loader2 size={16} className="animate-spin" /> A carregar comentários...
        </div>
      )}

      {!loading && error && <p className="py-2 text-sm font-bold text-red-500">{error}</p>}

      {!loading && !error && comments.length === 0 && (
        <p className="py-2 text-sm text-secondary">Ainda sem comentários. Sê o primeiro a dar feedback!</p>
      )}

      {!loading && !error && comments.length > 0 && (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const author = authors[comment.authorId]
            const isOwn = currentUser?.id === comment.authorId
            return (
              <li key={comment.id} className="rounded-lg border-2 border-strong bg-surface p-3">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <AuthorAvatar
                      name={author?.name}
                      photoURL={author?.photoURL}
                      size={26}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-primary">
                        {(author?.name || '').trim() || 'Aluno WebStart'}
                      </p>
                      <p className="text-[10px] text-secondary">{formatPostDate(comment.createdAt)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Denunciar comentário"
                    onClick={() => setReportComment(comment)}
                    className="rounded-lg p-1 text-secondary hover:text-red-500"
                  >
                    <Flag size={13} />
                  </button>
                  {isOwn && editingId !== comment.id && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="Editar comentário"
                        onClick={() => startEdit(comment)}
                        className="rounded-lg p-1 text-secondary hover:text-primary"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir comentário"
                        onClick={() => setPendingDelete(comment)}
                        className="rounded-lg p-1 text-secondary hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      maxLength={COMMENT_MAX}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className={`${inputClass} resize-y`}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={savingEdit}
                        className="inline-flex items-center gap-1 rounded-lg border-2 border-strong px-2.5 py-1 text-xs font-bold text-primary hover:bg-surface-hover disabled:opacity-50"
                      >
                        <X size={12} /> Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={savingEdit || !editText.trim()}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-50"
                      >
                        {savingEdit && <Loader2 size={12} className="animate-spin" />}
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line break-words text-sm leading-relaxed text-primary">
                    {comment.content}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir comentário"
        message="Tens a certeza que queres excluir este comentário? Esta ação não pode ser revertida."
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ReportModal
        open={Boolean(reportComment)}
        commentId={reportComment?.id}
        onClose={() => setReportComment(null)}
        onReported={() => {
          setReportComment(null)
          showSuccess('Denúncia enviada. Obrigado por ajudar a manter o feed seguro!')
        }}
      />
    </div>
  )
}
