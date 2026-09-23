import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Rocket } from 'lucide-react'
import { SEO } from '../../components/seo/SEO'
import { Header } from '../../components/layout/Header.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { CardSkeleton } from '../../components/ui/Skeleton.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import {
  FEED_PAGE_SIZE,
  createProject,
  deleteProject,
  getLikedProjectIds,
  getProjectsFeed,
  hydrateAuthors,
  toggleLike,
  updateProject,
} from '../../services/communityService.js'
import { resolveProfileId } from '../../services/userService.js'
import { ProjectCard } from './ProjectCard.jsx'
import { ProjectFormModal } from './ProjectFormModal.jsx'
import { toUserMessage } from '../../utils/errors.js'

const MAX_FILTER_TAGS = 12

export default function CommunityPage() {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()

  const [myProfileId, setMyProfileId] = useState(null)
  const [projects, setProjects] = useState([])
  const [authors, setAuthors] = useState({})
  const [likedIds, setLikedIds] = useState(() => new Set())
  const [likePendingIds, setLikePendingIds] = useState(() => new Set())

  const [sort, setSort] = useState('recent')
  const [activeTag, setActiveTag] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    resolveProfileId(user.id)
      .then((id) => {
        if (!cancelled) setMyProfileId(id || user.id)
      })
      .catch(() => {
        if (!cancelled) setMyProfileId(user.id)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const loadFeed = useCallback(
    async ({ tag, sortMode }) => {
      setLoading(true)
      setError(null)
      try {
        const result = await getProjectsFeed({ pageSize: FEED_PAGE_SIZE, tag, sort: sortMode })
        setProjects(result.projects)
        setLastDoc(result.lastDoc)
        setHasMore(result.hasMore)
        setAuthors(await hydrateAuthors(result.projects))
        if (user && result.projects.length > 0) {
          const liked = await getLikedProjectIds(user.id, result.projects.map((p) => p.id))
          setLikedIds(liked)
        }
      } catch (err) {
        setError(toUserMessage(err, 'Não foi possível carregar o feed.'))
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  useEffect(() => {
    loadFeed({ tag: activeTag, sortMode: sort })
  }, [activeTag, sort, loadFeed])

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const result = await getProjectsFeed({
        pageSize: FEED_PAGE_SIZE,
        cursor: lastDoc,
        tag: activeTag,
        sort,
      })
      setProjects((current) => [...current, ...result.projects])
      const newAuthors = await hydrateAuthors(result.projects)
      setAuthors((current) => ({ ...current, ...newAuthors }))
      if (user && result.projects.length > 0) {
        const liked = await getLikedProjectIds(user.id, result.projects.map((p) => p.id))
        setLikedIds((current) => new Set([...current, ...liked]))
      }
      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)
    } catch (err) {
      showError('Não foi possível carregar mais projetos.')
    } finally {
      setLoadingMore(false)
    }
  }, [activeTag, hasMore, lastDoc, loading, loadingMore, showError, sort, user])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: '300px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  const availableTags = useMemo(() => {
    const counts = new Map()
    projects.forEach((p) => (p.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)))
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FILTER_TAGS)
      .map(([tag]) => tag)
  }, [projects])

  const handleSelectTag = (tag) => {
    setActiveTag((current) => (current === tag ? null : tag))
  }

  const handleSelectSort = (mode) => {
    setSort(mode)
    if (mode === 'popular') setActiveTag(null)
  }

  const openCreate = () => {
    setEditingProject(null)
    setFormOpen(true)
  }

  const openEdit = (project) => {
    setEditingProject(project)
    setFormOpen(true)
  }

  const closeForm = () => {
    if (!formSubmitting) {
      setFormOpen(false)
      setEditingProject(null)
    }
  }

  const refreshAuthorFor = async (authorId) => {
    const hydrated = await hydrateAuthors([{ authorId }])
    setAuthors((current) => ({ ...current, ...hydrated }))
  }

  const handleSaveForm = async (payload, original) => {
    setFormSubmitting(true)
    try {
      if (original) {
        const updated = await updateProject(original.id, original, payload)
        setProjects((current) => current.map((p) => (p.id === updated.id ? updated : p)))
        showSuccess('Projeto atualizado!')
      } else {
        const created = await createProject(user.id, payload)
        setProjects((current) => [created, ...current])
        await refreshAuthorFor(created.authorId)
        showSuccess('Projeto publicado no feed!')
      }
      setFormOpen(false)
      setEditingProject(null)
    } catch (err) {
      showError(toUserMessage(err, 'Não foi possível guardar o projeto.'))
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete || deleting) return
    setDeleting(true)
    try {
      await deleteProject(pendingDelete.id)
      setProjects((current) => current.filter((p) => p.id !== pendingDelete.id))
      showSuccess('Projeto excluído.')
      setPendingDelete(null)
    } catch (err) {
      showError(toUserMessage(err, 'Não foi possível excluir o projeto.'))
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleLike = async (project) => {
    if (!user || likePendingIds.has(project.id)) return
    const wasLiked = likedIds.has(project.id)
    setLikePendingIds((current) => new Set(current).add(project.id))
    setLikedIds((current) => {
      const next = new Set(current)
      if (wasLiked) next.delete(project.id)
      else next.add(project.id)
      return next
    })
    setProjects((current) =>
      current.map((p) =>
        p.id === project.id ? { ...p, likeCount: Math.max(0, (p.likeCount ?? 0) + (wasLiked ? -1 : 1)) } : p,
      ),
    )
    try {
      await toggleLike(project.id)
    } catch (err) {
      setLikedIds((current) => {
        const next = new Set(current)
        if (wasLiked) next.add(project.id)
        else next.delete(project.id)
        return next
      })
      setProjects((current) =>
        current.map((p) =>
          p.id === project.id ? { ...p, likeCount: Math.max(0, (p.likeCount ?? 0) + (wasLiked ? 1 : -1)) } : p,
        ),
      )
      showError(toUserMessage(err, 'Não foi possível atualizar o gosto.'))
    } finally {
      setLikePendingIds((current) => {
        const next = new Set(current)
        next.delete(project.id)
        return next
      })
    }
  }

  const handleCommentCountChange = (project, delta) => {
    setProjects((current) =>
      current.map((p) =>
        p.id === project.id ? { ...p, commentCount: Math.max(0, (p.commentCount ?? 0) + delta) } : p,
      ),
    )
  }

  const chipBase =
    'rounded-full border-2 border-strong px-3 py-1 text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors'

  return (
    <>
      <SEO title="Feed" description="Descobre os projetos construídos pelos alunos da WebStart Academy e partilha o teu trabalho." />
      <Header
        title="Feed"
        subtitle="Mostra aquilo que estás a construir e inspira outros alunos."
      >
        <div className="hidden lg:block">
          <Button onClick={openCreate}>
            <Rocket size={18} /> Publicar projeto
          </Button>
        </div>
      </Header>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSelectSort('recent')}
              className={`${chipBase} ${sort === 'recent' ? 'bg-brand-500 text-white' : 'bg-surface text-primary hover:bg-surface-hover'}`}
            >
              Recentes
            </button>
            <button
              type="button"
              onClick={() => handleSelectSort('popular')}
              className={`${chipBase} ${sort === 'popular' ? 'bg-brand-500 text-white' : 'bg-surface text-primary hover:bg-surface-hover'}`}
            >
              Populares
            </button>
          </div>
          <div className="lg:hidden">
            <Button size="sm" onClick={openCreate}>
              <Rocket size={16} /> Publicar
            </Button>
          </div>
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={`${chipBase} ${!activeTag ? 'bg-brand-500 text-white' : 'bg-surface text-primary hover:bg-surface-hover'}`}
            >
              Todos
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelectTag(tag)}
                className={`${chipBase} ${activeTag === tag ? 'bg-brand-500 text-white' : 'bg-surface text-primary hover:bg-surface-hover'}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border-2 border-strong bg-surface p-8 text-center">
          <p className="mb-4 font-bold text-red-500">{error}</p>
          <Button variant="secondary" onClick={() => loadFeed({ tag: activeTag, sortMode: sort })}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-xl border-2 border-strong bg-surface p-10 text-center">
          <Rocket size={48} className="mx-auto mb-4 text-brand-500" />
          <h2 className="mb-1 text-lg font-black text-primary">
            {activeTag ? `Ainda não há projetos com #${activeTag}` : 'O feed ainda está vazio'}
          </h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-secondary">
            Sê o primeiro a publicar o projeto que estás a construir durante os teus estudos. Pode ser simples — o importante é começar!
          </p>
          {!activeTag && user && (
            <Button onClick={openCreate}>
              <Rocket size={18} /> Publicar o primeiro projeto
            </Button>
          )}
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                author={authors[project.authorId]}
                currentUser={user}
                isMine={Boolean(user) && myProfileId === project.authorId}
                liked={likedIds.has(project.id)}
                likePending={likePendingIds.has(project.id)}
                onToggleLike={handleToggleLike}
                onTagClick={handleSelectTag}
                onEdit={openEdit}
                onDelete={setPendingDelete}
                onCommentCountChange={handleCommentCountChange}
              />
            ))}
          </div>

          <div ref={sentinelRef} aria-hidden="true" />

          {loadingMore && (
            <div className="flex justify-center py-6">
              <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
          )}
        </>
      )}

      <ProjectFormModal
        open={formOpen}
        project={editingProject}
        submitting={formSubmitting}
        onClose={closeForm}
        onSave={handleSaveForm}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir projeto"
        message={
          pendingDelete
            ? `Tens a certeza que queres excluir "${pendingDelete.title}"? Os comentários e likes associados também serão removidos. Esta ação não pode ser revertida.`
            : ''
        }
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </>
  )
}
