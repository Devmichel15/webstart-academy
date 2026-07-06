import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { subscribeToAllUsersMerged, subscribeToAllProgress } from '../../services/adminService.js'
import { allLessons } from '../../data/lessons/index.js'
import { trails } from '../../data/trails.js'

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'mostActive', label: 'Mais ativos' },
  { value: 'leastActive', label: 'Menos ativos' },
  { value: 'highestProgress', label: 'Maior progresso' },
  { value: 'lowestProgress', label: 'Menor progresso' },
  { value: 'recentAccounts', label: 'Contas recentes' },
]

function toDate(ts) {
  if (!ts) return null
  if (ts.toDate) return ts.toDate()
  if (ts.seconds) return new Date(ts.seconds * 1000)
  return new Date(ts)
}

function UserRow({ user, expanded, onToggle }) {
  const completedCount = (user.completedLessons || []).length
  const totalLessons = allLessons.length
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const completedCourses = (user.completedCourses || []).length
  const currentTrail = user.currentCourse
    ? trails.find((t) => t.id === user.currentCourse)?.title || user.currentCourse
    : 'Nenhuma'
  const lastAccess = toDate(user.lastLogin) || toDate(user.createdAt)
  const createdAt = toDate(user.createdAt)
  const provider = user.provider || 'email'

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border transition hover:bg-surface-hover"
        onClick={onToggle}
      >
        <td className="py-3 pr-3">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold text-primary">{user.name || 'Sem nome'}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="hidden py-3 pr-3 md:table-cell">
          <Badge variant={provider === 'google' ? 'success' : 'default'}>
            {provider === 'google' ? 'Google' : 'Email'}
          </Badge>
        </td>
        <td className="hidden py-3 pr-3 sm:table-cell">
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold">{progressPct}%</span>
          </div>
        </td>
        <td className="hidden py-3 pr-3 lg:table-cell">
          <span className="font-bold">{completedCount}</span>
          <span className="text-muted"> / {totalLessons}</span>
        </td>
        <td className="hidden py-3 pr-3 lg:table-cell">
          <span className="font-bold">{completedCourses}</span>
        </td>
        <td className="hidden py-3 xl:table-cell">
          <span className="text-xs text-secondary">{currentTrail}</span>
        </td>
        <td className="hidden py-3 xl:table-cell">
          <span className="text-xs text-secondary">
            {lastAccess
              ? lastAccess.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })
              : '—'}
          </span>
        </td>
        <td className="py-3">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="border-b-3 border-strong bg-surface-hover px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-bold uppercase text-secondary">UID</p>
                <p className="break-all text-sm font-mono">{user.id}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-secondary">Email</p>
                <p className="text-sm font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-secondary">Criado em</p>
                <p className="text-sm font-semibold">
                  {createdAt
                    ? createdAt.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-secondary">Método de login</p>
                <Badge variant={provider === 'google' ? 'success' : 'default'}>
                  {provider === 'google' ? 'Google' : 'Email/Senha'}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-secondary">XP Total</p>
                <p className="text-sm font-bold">{user.xp || 0}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-secondary">Nível</p>
                <p className="text-sm font-bold">{user.level || 1}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-secondary">Streak</p>
                <p className="text-sm font-bold">{user.streak || 0} dias</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-secondary">Tempo de estudo</p>
                <p className="text-sm font-bold">
                  {user.totalStudyTime ? `${Math.round(user.totalStudyTime / 60)}h ${user.totalStudyTime % 60}min` : '—'}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [progressRecords, setProgressRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setLoading(true)
    const unsubUsers = subscribeToAllUsersMerged(
      () => {},
      (merged) => {
        setUsers(merged)
        setLoading(false)
      },
      () => setLoading(false),
    )
    const unsubProgress = subscribeToAllProgress(setProgressRecords, () => {})
    return () => {
      unsubUsers()
      unsubProgress()
    }
  }, [])

  const userProgressMap = useMemo(() => {
    const map = {}
    for (const r of progressRecords) {
      if (r.completed) {
        map[r.userId] = (map[r.userId] || 0) + 1
      }
    }
    return map
  }, [progressRecords])

  const filteredUsers = useMemo(() => {
    let result = [...users]

    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term),
      )
    }

    switch (filter) {
      case 'mostActive':
        result.sort((a, b) => (userProgressMap[b.id] || 0) - (userProgressMap[a.id] || 0))
        break
      case 'leastActive':
        result.sort((a, b) => (userProgressMap[a.id] || 0) - (userProgressMap[b.id] || 0))
        break
      case 'highestProgress': {
        result.sort((a, b) => {
          const aPct = allLessons.length > 0 ? ((a.completedLessons || []).length / allLessons.length) : 0
          const bPct = allLessons.length > 0 ? ((b.completedLessons || []).length / allLessons.length) : 0
          return bPct - aPct
        })
        break
      }
      case 'lowestProgress': {
        result.sort((a, b) => {
          const aPct = allLessons.length > 0 ? ((a.completedLessons || []).length / allLessons.length) : 0
          const bPct = allLessons.length > 0 ? ((b.completedLessons || []).length / allLessons.length) : 0
          return aPct - bPct
        })
        break
      }
      case 'recentAccounts':
        result.sort((a, b) => {
          const aDate = toDate(a.createdAt)?.getTime() || 0
          const bDate = toDate(b.createdAt)?.getTime() || 0
          return bDate - aDate
        })
        break
      default:
        break
    }

    return result
  }, [users, search, filter, userProgressMap])

  const toggleExpand = useCallback(
    (id) => setExpandedId((prev) => (prev === id ? null : id)),
    [],
  )

  const activeFilterLabel = FILTER_OPTIONS.find((f) => f.value === filter)?.label

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-primary">Gestão de Utilizadores</h2>
        <p className="text-sm text-secondary">Visualize e analise todos os utilizadores da plataforma</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border-3 border-strong bg-surface py-2.5 pl-10 pr-4 text-sm font-semibold text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            {filter === 'all' ? 'Filtros' : activeFilterLabel}
            <ChevronDown size={14} />
          </Button>
          {showFilters && (
            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border-3 border-strong bg-surface shadow-lg">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilter(opt.value)
                    setShowFilters(false)
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm font-semibold transition ${
                    filter === opt.value
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      : 'text-primary hover:bg-surface-hover'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Badge>{filteredUsers.length} utilizador(es)</Badge>
      </div>

      <Card className="overflow-hidden !p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-muted">Nenhum utilizador encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-3 border-strong bg-surface-hover text-xs font-bold uppercase tracking-wide text-secondary">
                  <th className="px-4 py-3">Utilizador</th>
                  <th className="hidden px-4 py-3 md:table-cell">Login</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Progresso</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Aulas</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Trilhas</th>
                  <th className="hidden px-4 py-3 xl:table-cell">Trilha Atual</th>
                  <th className="hidden px-4 py-3 xl:table-cell">Último Acesso</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    progressCount={userProgressMap[user.id] || 0}
                    expanded={expandedId === user.id}
                    onToggle={() => toggleExpand(user.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
