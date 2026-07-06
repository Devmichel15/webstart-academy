import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Users,
  Award,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { Card } from '../../components/ui/Card'
import { subscribeToAllUsersMerged, subscribeToAllProgress, computeChartData } from '../../services/adminService.js'
import { allLessons } from '../../data/lessons/index.js'

const TRAIL_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1',
]

const chartTooltipStyle = {
  backgroundColor: 'var(--color-surface, #fff)',
  border: '2px solid var(--color-border, #e5e7eb)',
  borderRadius: 8,
  fontWeight: 700,
}

export default function AdminAnalytics() {
  const [users, setUsers] = useState([])
  const [progressRecords, setProgressRecords] = useState([])
  const [loading, setLoading] = useState(true)

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

  const chartData = useMemo(
    () => computeChartData(users, progressRecords),
    [users, progressRecords],
  )

  const trailCompletionPie = useMemo(() => {
    return chartData.trailStats
      .filter((t) => t.started > 0)
      .map((t) => ({
        name: t.title,
        value: t.started,
        completed: t.completed,
      }))
  }, [chartData])

  const lessonPopularityTop = useMemo(() => {
    const sorted = Object.entries(chartData.lessonPopularity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    return sorted.map(([id, count]) => {
      const lesson = allLessons.find((l) => l.id === id)
      return {
        name: lesson?.title || id,
        conclusoes: count,
      }
    })
  }, [chartData])

  const lessonPopularityBottom = useMemo(() => {
    const sorted = Object.entries(chartData.lessonPopularity)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10)
    return sorted.map(([id, count]) => {
      const lesson = allLessons.find((l) => l.id === id)
      return {
        name: lesson?.title || id,
        conclusoes: count,
      }
    })
  }, [chartData])

  const abandonData = useMemo(() => {
    return chartData.trailStats
      .filter((t) => t.started > 0)
      .map((t) => ({
        name: t.title,
        'Taxa de Abandono': t.abandonRate,
        'Taxa de Conclusão': t.completionRate,
      }))
  }, [chartData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-primary">Análises de Aprendizagem</h2>
        <p className="text-sm text-secondary">Gráficos e indicadores detalhados de utilização</p>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-brand-500" />
              <h3 className="text-lg font-black">Aulas Concluídas por Dia</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.lessonsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="aulas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              <h3 className="text-lg font-black">Novos Utilizadores por Dia</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.usersPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="utilizadores" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-500" />
              <h3 className="text-lg font-black">Evolução do Crescimento</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Award size={20} className="text-brand-500" />
              <h3 className="text-lg font-black">Trilhas Mais Iniciadas</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trailCompletionPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {trailCompletionPie.map((_, index) => (
                    <Cell key={index} fill={TRAIL_COLORS[index % TRAIL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <TrendingDown size={20} className="text-orange-500" />
              <h3 className="text-lg font-black">Trilhas com Maior Taxa de Abandono</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={abandonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="Taxa de Abandono" fill="#ef4444" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Taxa de Conclusão" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-500" />
              <h3 className="text-lg font-black">Trilhas Mais Concluídas</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.trailStats.filter((t) => t.completed > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="completed" name="Concluídas" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Award size={20} className="text-green-500" />
              <h3 className="text-lg font-black">Aulas Mais Assistidas</h3>
            </div>
            {lessonPopularityTop.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">Sem dados de conclusões ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-3 border-strong text-xs font-bold uppercase text-secondary">
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2 pr-2">Aula</th>
                      <th className="py-2">Conclusões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessonPopularityTop.map((l, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="py-2 pr-2 font-bold text-secondary">{i + 1}</td>
                        <td className="py-2 pr-2 font-semibold">{l.name}</td>
                        <td className="py-2 font-bold">{l.conclusoes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-red-500" />
              <h3 className="text-lg font-black">Aulas Menos Assistidas</h3>
            </div>
            {lessonPopularityBottom.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">Sem dados de conclusões ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-3 border-strong text-xs font-bold uppercase text-secondary">
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2 pr-2">Aula</th>
                      <th className="py-2">Conclusões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessonPopularityBottom.map((l, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="py-2 pr-2 font-bold text-secondary">{i + 1}</td>
                        <td className="py-2 pr-2 font-semibold">{l.name}</td>
                        <td className="py-2 font-bold">{l.conclusoes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
