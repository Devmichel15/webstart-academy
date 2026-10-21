import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Edit, MoreHorizontal, Rocket, Trash2, User } from 'lucide-react'
import { formatPostRelative } from '../../utils/formatDate.js'

export function PostHeader({
  author = null,
  createdAt = null,
  action = 'publicou um projeto',
  isMine = false,
  badgeIcon: EventIcon = Rocket,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const name = author?.name || author?.username || 'Aluno'
  const avatar = author?.photoURL || author?.photo_url || ''
  const username = author?.username || ''

  useEffect(() => {
    if (!menuOpen) return undefined
    const handle = (e) => {
      if (!e.target.closest('[data-card-menu]')) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  const nameNode = username ? (
    <Link to={`/u/${username}`} className="font-bold text-primary hover:underline">
      {name}
    </Link>
  ) : (
    <span className="font-bold text-primary">{name}</span>
  )

  const avatarNode = avatar ? (
    username ? (
      <Link to={`/u/${username}`} className="block h-10 w-10" aria-label={`Ver perfil de ${name}`}>
        <img
          src={avatar}
          alt={name}
          className="h-10 w-10 rounded-full border-2 border-strong object-cover"
        />
      </Link>
    ) : (
      <img
        src={avatar}
        alt={name}
        className="h-10 w-10 rounded-full border-2 border-strong object-cover"
      />
    )
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-strong bg-accent-soft">
      <User size={18} className="text-secondary" />
    </div>
  )

  return (
    <header className="flex items-start gap-3">
      <div className="relative shrink-0">
        {avatarNode}
        <span
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-accent text-white"
          title={action}
        >
          <EventIcon size={11} strokeWidth={3} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-snug text-secondary">
          {nameNode} {action}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-secondary">{formatPostRelative(createdAt)}</p>
      </div>

      {isMine && (
        <div className="relative shrink-0" data-card-menu>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Opções do projeto"
            aria-expanded={menuOpen}
            className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-surface-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-lg border-2 border-strong bg-elevated shadow-hard-sm">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onEdit?.()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-hover"
              >
                <Edit size={16} /> Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onDelete?.()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-surface-hover"
              >
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
