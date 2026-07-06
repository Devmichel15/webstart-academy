import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Award,
  RefreshCw,
  Crown,
  Target,
  Flame,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import {
  subscribeToAllUsersMerged,
  subscribeToAllProgress,
  computeDashboardMetrics,
  computeRankings,
  computeChartData,
  computeInsights,
} from '../../services/adminService.js'

function StatCard({ icon: Icon, label, value, delay = 0, color = 'text-brand-500', onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card hover className={`h-full ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-secondary">{label}</p>
            <p className="text-3xl font-black text-primary">{value}</p>
          </div>
          <div className={`rounded-lg bg-surface-hover p-2 ${color}`}>
            <Icon size={20} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function RankingTable({ title, data, valueLabel, icon: Icon }) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Icon size={20} className="text-brand-500" />
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      {data.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">Sem dados disponíveis.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-3 border-strong text-xs font-bold uppercase tracking-wide text-secondary">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Aluno</th>
                <th className="py-2 pr-2">{valueLabel}</th>
                <th className="py-2">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u, i) => (
                <tr key={u.id} className="border-b border-border">
                  <td className="py-2 pr-2 font-bold text-secondary">{i + 1}</td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-2">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="h-6 w-6 rounded-full" />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-bold">{u.name}</p>
                        <p className="truncate text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-2 font-bold">{valueLabel === 'Aulas' ? u.completedLessons : valueLabel === 'Trilhas' ? u.completedCourses : `${u.progressPct}%`}</td>
                  <td className="py-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${u.progressPct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function InsightItem({ text }) {
  return (
    <li className="flex items-start gap-2 rounded-lg border-2 border-dashed border-brand-200 bg-brand-50/50 p-3 text-sm dark:border-brand-800 dark:bg-brand-950/50">
      <TrendingUp size={16} className="mt-0.5 shrink-0 text-brand-500" />
      <span className="font-semibold text-primary">{text}</span>
    </li>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [progressRecords, setProgressRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  useEffect(() => {
    setLoading(true)
    const unsubUsers = subscribeToAllUsersMerged(
      () => {},
      (merged) => {
        setUsers(merged)
        setLoading(false)
        setLastRefresh(new Date())
      },
      () => setLoading(false),
    )
    const unsubProgress = subscribeToAllProgress(setProgressRecords, () => {})

    return () => {
      unsubUsers()
      unsubProgress()
    }
  }, [])

  const metrics = useMemo(
    () => computeDashboardMetrics(users, progressRecords),
    [users, progressRecords],
  )

  const rankings = useMemo(
    () => computeRankings(users),
    [users, progressRecords, metrics],
  )

  const chartData = useMemo(
    () => computeChartData(users, progressRecords),
    [users, progressRecords],
  )

  const insights = useMemo(
    () => computeInsights(metrics, chartData.trailStats, chartData.lessonPopularity),
    [metrics, chartData],
  )

  const handleRefresh = useCallback(() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-primary">Dashboard</h2>
          <p className="text-sm text-secondary">Visão geral da plataforma em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted">
              Atualizado: {lastRefresh.toLocaleTimeString('pt-PT')}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Utilizadores" value={metrics.totalUsers} delay={0} />
        <StatCard icon={UserPlus} label="Novos Hoje" value={metrics.newToday} delay={0.05} color="text-green-500" />
        <StatCard icon={UserPlus} label="Novos Esta Semana" value={metrics.newThisWeek} delay={0.1} color="text-blue-500" />
        <StatCard icon={UserPlus} label="Novos Este Mês" value={metrics.newThisMonth} delay={0.15} color="text-purple-500" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Total Trilhas" value={metrics.totalTrails} delay={0.2} />
        <StatCard icon={Target} label="Total Módulos" value={metrics.totalModules} delay={0.25} color="text-orange-500" />
        <StatCard icon={GraduationCap} label="Total Aulas" value={metrics.totalLessons} delay={0.3} color="text-blue-500" />
        <StatCard icon={Award} label="Aulas Concluídas" value={metrics.totalCompletedLessons} delay={0.35} color="text-green-500" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Progresso Médio" value={`${metrics.avgProgress}%`} delay={0.4} color="text-brand-500" />
        <StatCard icon={Flame} label="Utilizadores Ativos" value={metrics.activeUsers} delay={0.45} color="text-orange-500" />
        <StatCard icon={Award} label="Concluíram ≥1 Trilha" value={metrics.usersCompletedAnyTrail} delay={0.5} color="text-green-500" />
        <StatCard icon={Crown} label="Concluíram Todas" value={metrics.usersCompletedAllTrails} delay={0.55} color="text-yellow-500" />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <h3 className="mb-4 text-lg font-black">Aulas Concluídas (30 dias)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.lessonsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface, #fff)',
                    border: '2px solid var(--color-border, #e5e7eb)',
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                />
                <Area type="monotone" dataKey="aulas" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <Card>
            <h3 className="mb-4 text-lg font-black">Novos Utilizadores (30 dias)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.usersPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface, #fff)',
                    border: '2px solid var(--color-border, #e5e7eb)',
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                />
                <Area type="monotone" dataKey="utilizadores" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <h3 className="mb-4 text-lg font-black">Crescimento da Plataforma</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface, #fff)',
                    border: '2px solid var(--color-border, #e5e7eb)',
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
          <Card>
            <h3 className="mb-4 text-lg font-black">Trilhas — Iniciadas vs Concluídas</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.trailStats.filter((t) => t.started > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="title" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface, #fff)',
                    border: '2px solid var(--color-border, #e5e7eb)',
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="started" name="Iniciadas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Concluídas" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <RankingTable
          title="Top 10 — Progresso"
          data={rankings.byProgress}
          valueLabel="Progresso"
          icon={TrendingUp}
        />
        <RankingTable
          title="Top 10 — Aulas"
          data={rankings.byLessons}
          valueLabel="Aulas"
          icon={GraduationCap}
        />
        <RankingTable
          title="Top 10 — Trilhas"
          data={rankings.byCourses}
          valueLabel="Trilhas"
          icon={Award}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-500" />
            <h3 className="text-lg font-black">Insights Automáticos</h3>
          </div>
          {insights.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">Sem insights disponíveis ainda.</p>
          ) : (
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <InsightItem key={i} text={insight} />
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={() => navigate('/admin/users')}>
          Ver todos os utilizadores
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
