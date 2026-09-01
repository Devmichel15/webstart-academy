import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Github, Heart, MessageCircle, Rocket } from 'lucide-react'
import { Card } from '../../components/ui/Card.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { getUserProjects } from '../../services/communityService.js'
import { formatDatePt as formatPostDate } from '../../utils/formatDate.js'

export function ProfileProjectsSection() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user?.uid) return undefined
    let active = true
    setLoading(true)
    setError(false)
    getUserProjects(user.id)
      .then((list) => active && setProjects(list))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user?.uid])

  return (
    <Card className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Rocket size={20} className="text-brand-500" /> Projetos
        </h2>
        <Link
          to="/feed"
          className="text-sm font-bold text-brand-600 hover:text-brand-500 dark:text-brand-300"
        >
          Gerir no feed →
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm font-bold text-red-500">Não foi possível carregar os teus projetos.</p>
      )}

      {!loading && !error && projects.length === 0 && (
        <p className="text-sm text-secondary">
          Ainda não publicaste nenhum projeto. Partilha o teu primeiro trabalho no{' '}
          <Link to="/feed" className="font-bold text-brand-600 dark:text-brand-300">
            Feed
          </Link>
          !
        </p>
      )}

      {!loading && !error && projects.length > 0 && (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-lg border-2 border-strong bg-surface-hover p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-primary">{project.title}</p>
                  <p className="text-xs text-secondary">{formatPostDate(project.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-secondary">
                  <span className="inline-flex items-center gap-1">
                    <Heart size={14} /> {project.likeCount ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={14} /> {project.commentCount ?? 0}
                  </span>
                  {project.projectUrl && (
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir projeto ${project.title}`}
                      className="rounded-lg p-1 hover:bg-surface hover:text-primary"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir GitHub de ${project.title}`}
                      className="rounded-lg p-1 hover:bg-surface hover:text-primary"
                    >
                      <Github size={16} />
                    </a>
                  )}
                </div>
              </div>
              {(project.tags || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border-2 border-strong bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:bg-surface"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
