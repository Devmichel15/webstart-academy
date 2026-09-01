import { supabase } from '../lib/supabase.js'
import { trails } from '../data/trails.js'
import { allLessons } from '../data/lessons/index.js'
import { allModules } from '../data/modules/index.js'
import { getAccessibleTrails } from './trailProgressService.js'

const USERS_PER_PAGE = 50

function mapProfileRow(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role,
    provider: row.provider,
    xp: row.xp || 0,
    level: row.level || 1,
    streak: row.streak || 0,
    completedLessons: row.completed_lessons || [],
    completedCourses: row.completed_courses || [],
    completedExercises: row.completed_exercises || 0,
    completedProjects: row.completed_projects || 0,
    completedQuizzes: row.completed_quizzes || [],
    isPublic: row.is_public,
    photoURL: row.photo_url,
    createdAt: row.created_at,
    lastLogin: row.last_login,
    totalStudyTime: row.total_study_time || 0,
  }
}

function mapProgressRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    moduleId: row.module_id,
    lessonId: row.lesson_id,
    completed: row.completed,
    completedAt: row.completed_at,
    progressPercentage: row.progress_percentage,
    timeSpent: row.time_spent,
  }
}

export async function fetchAllUsersFromCloudFunction() {
  try {
    return await getAllUsers()
  } catch (err) {
    console.error('[adminService] Failed to list users:', err)
    return null
  }
}

export function subscribeToAllUsers(callback, onError) {
  const channel = supabase
    .channel('admin-users')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      async () => {
        try {
          const users = await getAllUsers()
          callback(users)
        } catch (err) {
          onError?.(err)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        getAllUsers()
          .then(callback)
          .catch(onError)
      }
    })

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapProfileRow)
}

export async function getUsersPage(cursor = null) {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(USERS_PER_PAGE)

  if (cursor) {
    query = query.gt('created_at', cursor)
  }

  const { data, error } = await query
  if (error) throw error

  const users = (data || []).map(mapProfileRow)
  const lastCursor = users.length > 0 ? users[users.length - 1].createdAt : null

  return {
    users,
    lastDoc: lastCursor,
    hasMore: users.length === USERS_PER_PAGE,
  }
}

export function mergeCloudData(firestoreUsers, cloudUsers) {
  if (!cloudUsers || cloudUsers.length === 0) return firestoreUsers

  const merged = new Map()
  const seenFromAuth = new Set()

  const cloudUids = new Map()
  for (const cu of cloudUsers) {
    if (cu._fromAuth) {
      seenFromAuth.add(cu.uid || cu.id)
    }
    cloudUids.set(cu.uid || cu.id, cu)
  }

  for (const fu of firestoreUsers) {
    const uid = fu.uid || fu.id
    merged.set(uid, fu)
  }

  for (const [uid, cu] of cloudUids) {
    if (!merged.has(uid)) {
      merged.set(uid, cu)
    }
  }

  return Array.from(merged.values())
}

export function subscribeToAllUsersMerged(_firestoreCallback, mergeCallback, onError) {
  const loadAndMerge = () => {
    getAllUsers()
      .then((users) => mergeCallback(users))
      .catch((err) => {
        console.error('[adminService] Error loading users:', err)
        onError?.(err)
      })
  }

  const channel = supabase
    .channel('admin-users-merged')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      loadAndMerge
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') loadAndMerge()
    })

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function getAllProgressRecords() {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')

  if (error) throw error
  return (data || []).map(mapProgressRow)
}

export function subscribeToAllProgress(callback, onError) {
  const channel = supabase
    .channel('admin-progress')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lesson_progress' },
      async () => {
        try {
          const records = await getAllProgressRecords()
          callback(records)
        } catch (err) {
          onError?.(err)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        getAllProgressRecords()
          .then(callback)
          .catch(onError)
      }
    })

  return () => {
    supabase.removeChannel(channel)
  }
}

function toDate(ts) {
  if (!ts) return null
  if (ts instanceof Date) return ts
  if (typeof ts === 'string') return new Date(ts)
  if (ts.seconds) return new Date(ts.seconds * 1000)
  return new Date(ts)
}

function getStartOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfMonth(date) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

export function computeDashboardMetrics(users, progressRecords) {
  const now = new Date()
  const todayStart = getStartOfDay(now)
  const weekStart = getStartOfWeek(now)
  const monthStart = getStartOfMonth(now)

  let newToday = 0
  let newThisWeek = 0
  let newThisMonth = 0
  let totalCompletedLessons = 0
  const userLessonCounts = {}
  const userCourseCompletions = {}

  for (const u of users) {
    const created = toDate(u.createdAt)
    if (created && created >= todayStart) newToday++
    if (created && created >= weekStart) newThisWeek++
    if (created && created >= monthStart) newThisMonth++
  }

  const uniqueUsersWithProgress = new Set()
  for (const r of progressRecords) {
    if (r.completed) {
      totalCompletedLessons++
      uniqueUsersWithProgress.add(r.userId)
      userLessonCounts[r.userId] = (userLessonCounts[r.userId] || 0) + 1
    }
  }

  for (const u of users) {
    const courses = u.completedCourses || []
    if (courses.length > 0) {
      userCourseCompletions[u.id] = courses.length
    }
  }

  const usersCompletedAnyTrail = Object.keys(userCourseCompletions).length
  const usersCompletedAllTrails = users.filter((u) => {
    const availableTrails = trails.filter((t) => t.status === 'available')
    return availableTrails.every((t) => (u.completedCourses || []).includes(t.id))
  }).length

  let totalProgressSum = 0
  let activeUsersCount = 0
  const accessibleCount = getAccessibleTrails().length
  for (const u of users) {
    const completed = (u.completedLessons || []).length
    const pct = allLessons.length > 0 ? Math.round((completed / allLessons.length) * 100) : 0
    totalProgressSum += pct
    if (completed > 0) activeUsersCount++
  }
  const avgProgress = users.length > 0 ? Math.round(totalProgressSum / users.length) : 0

  const totalTrails = accessibleCount
  const totalModules = allModules.length
  const totalLessons = allLessons.length

  return {
    totalUsers: users.length,
    newToday,
    newThisWeek,
    newThisMonth,
    totalTrails,
    totalModules,
    totalLessons,
    totalCompletedLessons,
    avgProgress,
    activeUsers: activeUsersCount,
    usersCompletedAnyTrail,
    usersCompletedAllTrails,
    userLessonCounts,
    userCourseCompletions,
  }
}

export function computeRankings(users) {
  const accessibleCount = getAccessibleTrails().length
  const userRanking = users.map((u) => {
    const completed = u.completedLessons || []
    const completedCount = completed.length
    const totalLessons = allLessons.length
    const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
    const completedCourses = (u.completedCourses || []).length
    const lastAccess = toDate(u.lastLogin) || toDate(u.createdAt)

    return {
      id: u.id,
      name: u.name || 'Sem nome',
      email: u.email || '',
      photoURL: u.photoURL || '',
      completedLessons: completedCount,
      progressPct,
      completedCourses: completedCourses > accessibleCount ? accessibleCount : completedCourses,
      lastAccess,
      xp: u.xp || 0,
    }
  })

  const byProgress = [...userRanking].sort((a, b) => b.progressPct - a.progressPct).slice(0, 10)
  const byLessons = [...userRanking].sort((a, b) => b.completedLessons - a.completedLessons).slice(0, 10)
  const byCourses = [...userRanking].sort((a, b) => b.completedCourses - a.completedCourses).slice(0, 10)

  return { byProgress, byLessons, byCourses }
}

export function computeChartData(users, progressRecords) {
  const lessonsPerDay = []
  for (let i = 29; i >= 0; i--) {
    const day = daysAgo(i)
    const dayEnd = new Date(day)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const count = progressRecords.filter((r) => {
      if (!r.completed) return false
      const d = toDate(r.completedAt)
      return d && d >= day && d < dayEnd
    }).length
    lessonsPerDay.push({
      date: day.toISOString().slice(5, 10),
      aulas: count,
    })
  }

  const usersPerDay = []
  for (let i = 29; i >= 0; i--) {
    const day = daysAgo(i)
    const dayEnd = new Date(day)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const count = users.filter((u) => {
      const d = toDate(u.createdAt)
      return d && d >= day && d < dayEnd
    }).length
    usersPerDay.push({
      date: day.toISOString().slice(5, 10),
      utilizadores: count,
    })
  }

  const trailStats = trails.map((trail) => {
    const trailLessons = allLessons.filter((l) => l.courseId === trail.id)
    const totalTrailLessons = trailLessons.length
    const uniqueStarted = new Set()
    const uniqueCompleted = new Set()
    for (const r of progressRecords) {
      if (trailLessons.some((l) => l.id === r.lessonId)) {
        uniqueStarted.add(r.userId)
        if (r.completed) uniqueCompleted.add(r.userId)
      }
    }
    return {
      id: trail.id,
      title: trail.title,
      started: uniqueStarted.size,
      completed: uniqueCompleted.size,
      totalLessons: totalTrailLessons,
      completionRate: uniqueStarted.size > 0
        ? Math.round((uniqueCompleted.size / uniqueStarted.size) * 100)
        : 0,
      abandonRate: uniqueStarted.size > 0
        ? Math.round(((uniqueStarted.size - uniqueCompleted.size) / uniqueStarted.size) * 100)
        : 0,
    }
  })

  const lessonPopularity = {}
  for (const r of progressRecords) {
    if (r.completed) {
      lessonPopularity[r.lessonId] = (lessonPopularity[r.lessonId] || 0) + 1
    }
  }

  const growthData = []
  for (let i = 29; i >= 0; i--) {
    const day = daysAgo(i)
    const dayEnd = new Date(day)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const totalOnDay = users.filter((u) => {
      const d = toDate(u.createdAt)
      return d && d < dayEnd
    }).length
    growthData.push({
      date: day.toISOString().slice(5, 10),
      total: totalOnDay,
    })
  }

  return { lessonsPerDay, usersPerDay, trailStats, lessonPopularity, growthData }
}

export function computeInsights(metrics, trailStats, lessonPopularity) {
  const insights = []

  const popularTrail = [...trailStats].sort((a, b) => b.started - a.started)[0]
  if (popularTrail && popularTrail.started > 0) {
    insights.push(`A trilha "${popularTrail.title}" é a mais popular com ${popularTrail.started} aluno(s) iniciado(s).`)
  }

  const mostCompletedTrail = [...trailStats].sort((a, b) => b.completionRate - a.completionRate)[0]
  if (mostCompletedTrail && mostCompletedTrail.completed > 0) {
    insights.push(`A trilha "${mostCompletedTrail.title}" tem a maior taxa de conclusão (${mostCompletedTrail.completionRate}%).`)
  }

  const highestAbandon = [...trailStats].sort((a, b) => b.abandonRate - a.abandonRate)[0]
  if (highestAbandon && highestAbandon.abandonRate > 50) {
    insights.push(`A trilha "${highestAbandon.title}" tem a maior taxa de abandono (${highestAbandon.abandonRate}%).`)
  }

  if (metrics.newThisWeek > 0) {
    insights.push(`${metrics.newThisWeek} novo(s) utilizador(es) entraram nos últimos 7 dias.`)
  }

  const availableTrails = trails.filter((t) => t.status === 'available')
  if (availableTrails.length > 0 && metrics.totalUsers > 0) {
    const avgCourses = metrics.totalUsers > 0
      ? Math.round((Object.values(metrics.userCourseCompletions).reduce((s, v) => s + v, 0) / metrics.totalUsers) * 100) / 100
      : 0
    insights.push(`A média de trilhas concluídas por utilizador é de ${avgCourses}.`)
  }

  const sortedLessons = Object.entries(lessonPopularity).sort((a, b) => b[1] - a[1])
  if (sortedLessons.length > 0) {
    const topLesson = allLessons.find((l) => l.id === sortedLessons[0][0])
    if (topLesson) {
      insights.push(`A aula "${topLesson.title}" possui o maior número de conclusões (${sortedLessons[0][1]}).`)
    }
  }

  if (sortedLessons.length > 0) {
    const bottomLesson = allLessons.find((l) => l.id === sortedLessons[sortedLessons.length - 1][0])
    if (bottomLesson) {
      insights.push(`A aula "${bottomLesson.title}" tem o menor número de conclusões (${sortedLessons[sortedLessons.length - 1][1]}).`)
    }
  }

  if (metrics.totalUsers > 0) {
    const completionPct = Math.round((metrics.usersCompletedAllTrails / metrics.totalUsers) * 100)
    insights.push(`${completionPct}% dos utilizadores concluíram todas as trilhas disponíveis.`)
  }

  return insights
}

export async function getReactivationUsers() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .lt('last_login', thirtyDaysAgo.toISOString())
      .or('last_login.is.null')

    if (profileError) throw profileError

    const { data: progressRecords, error: progressError } = await supabase
      .from('lesson_progress')
      .select('user_id')
      .gte('completed_at', thirtyDaysAgo.toISOString())

    if (progressError) throw progressError

    const activeUserIds = new Set(progressRecords?.map((r) => r.user_id) || [])
    const eligible = (profiles || []).filter((p) => !activeUserIds.has(p.id))

    return {
      users: eligible.map((p) => ({
        uid: p.id,
        name: p.name,
        email: p.email,
        lastLogin: p.last_login,
        lastReactivationEmail: p.last_reactivation_email,
      })),
    }
  } catch (err) {
    console.error('[adminService] getReactivationUsers error:', err)
    throw err
  }
}
