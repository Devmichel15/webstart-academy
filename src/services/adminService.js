import { supabase } from '../lib/supabase.js'
import { trails } from '../data/trails.js'
import { allLessons, allVideoLessons } from '../data/lessons/index.js'
import { allModules } from '../data/modules/index.js'
import { getAccessibleTrails, getJourneyProgress } from './trailProgressService.js'
import {
  getLocalDayKey,
  getStartOfLocalDay,
  getStartOfLocalWeek,
  getStartOfLocalMonth,
} from '../utils/dates.js'

const USERS_PER_PAGE = 50

function mapProfileRow(row) {
  if (!row) return null
  return {
    id: row.id,
    // `auth_user_id` liga a linha migrada (id = uuidv5 do firebase uid) ao auth
    // uid. O total de utilizadores tem de contar PESSOAS, não linhas: um
    // migrado tem as duas (bug #18).
    authUserId: row.auth_user_id || null,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role,
    provider: row.provider,
    xp: row.xp || 0,
    level: row.level || 1,
    streak: row.streak || 0,
    // BUG #19: `current_course` não era mapeado, e `AdminUsers.jsx` lê
    // `user.currentCourse` → caía sempre no fallback "Nenhuma".
    currentCourse: row.current_course || null,
    currentLesson: row.current_lesson || null,
    completedLessons: row.completed_lessons || [],
    completedCourses: row.completed_courses || [],
    completedExercises: row.completed_exercises || 0,
    completedProjects: row.completed_projects || 0,
    completedQuizzes: row.completed_quizzes || [],
    isPublic: row.is_public,
    photoURL: row.photo_url,
    bio: row.bio || null,
    githubUrl: row.github_url || null,
    portfolioUrl: row.portfolio_url || null,
    linkedinUrl: row.linkedin_url || null,
    twitterUrl: row.twitter_url || null,
    instagramUrl: row.instagram_url || null,
    websiteUrl: row.website_url || null,
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
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') loadAndMerge()
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(err || new Error(`Admin user subscription failed: ${status}`))
      }
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
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        getAllProgressRecords()
          .then(callback)
          .catch(onError)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(err || new Error(`Admin progress subscription failed: ${status}`))
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

// Os limites de dia vêm de `utils/dates` (bug #16): antes eram `setHours(0,0,0,0)`
// sobre o fuso do browser de quem abre o painel, pelo que "Novos hoje" mudava
// conforme a máquina do admin. Um dia civil só tem uma definição em todo o código.

function daysAgo(n) {
  return getStartOfLocalDay(new Date(Date.now() - n * 86400000))
}

/**
 * Trilha atual de uma linha do painel admin.
 *
 * `profiles.current_course` é escrito quando o utilizador visita uma aula.
 * Se não existir um valor válido, deriva-se o progresso das aulas concluídas
 * e dos cursos/módulos concluídos, seguindo a regra de `getJourneyProgress()`.
 * IDs que já não existem no catálogo não devem inventar uma trilha atual.
 */
export function getUserTrailForRow(user, progressRecords = []) {
  const accessibleTrailIds = new Set(getAccessibleTrails().map((trail) => trail.id))
  const persistedTrail = trails.find(
    (trail) => trail.id === user?.currentCourse && accessibleTrailIds.has(trail.id),
  )
  if (persistedTrail) return persistedTrail.id

  const userIds = new Set([user?.id, user?.authUserId].filter(Boolean))
  const lessonsById = new Map(
    [...allLessons, ...allVideoLessons].map((lesson) => [lesson.id, lesson]),
  )
  const userProgress = progressRecords.filter((record) => {
    if (!record.completed || !userIds.has(record.userId)) return false
    const lesson = lessonsById.get(record.lessonId)
    return (
      lesson &&
      accessibleTrailIds.has(lesson.courseId) &&
      (!record.courseId || record.courseId === lesson.courseId)
    )
  })
  const validCompletedLessons = (user?.completedLessons || []).filter((lessonId) => {
    const lesson = lessonsById.get(lessonId)
    return lesson && accessibleTrailIds.has(lesson.courseId)
  })
  const completedLessons = [
    ...new Set([
      ...validCompletedLessons,
      ...userProgress.map((record) => record.lessonId).filter(Boolean),
    ]),
  ]
  const completedCourses = (user?.completedCourses || []).filter((courseId) =>
    accessibleTrailIds.has(courseId),
  )
  const accessibleModuleIds = new Set(
    allModules
      .filter((module) => accessibleTrailIds.has(module.courseId))
      .map((module) => module.id),
  )
  const completedQuizzes = (user?.completedQuizzes || []).filter((moduleId) =>
    accessibleModuleIds.has(moduleId),
  )
  if (completedCourses.length === 0 && completedLessons.length === 0 && completedQuizzes.length === 0) {
    return null
  }

  const journey = getJourneyProgress(completedCourses, completedLessons, completedQuizzes)
  return journey.currentTrail || null
}

/**
 * Agrega linhas de `profiles` por PESSOA.
 *
 * Chave: `auth_user_id` quando existe (o perfil migrado fica ligado ao auth
 * uid), senão o próprio `id`. Sem `auth_user_id` duas linhas são duas pessoas.
 * Dentro de cada pessoa escolhe-se a linha canónica: primeiro a que tem
 * histórico (mesmo critério de `userService.pickCanonicalProfileRow`), depois
 * a que tem nome, depois a primeira.
 */
function groupRowsByPerson(rows) {
  const byPerson = new Map();
  for (const row of rows || []) {
    if (!row) continue;
    const key = row.authUserId || row.id;
    if (!key) continue;
    const existing = byPerson.get(key);
    if (!existing) {
      byPerson.set(key, row);
      continue;
    }
    byPerson.set(key, pickCanonical(existing, row));
  }
  return byPerson;
}

function hasHistory(row) {
  return (row.xp || 0) > 0 || (row.completedLessons || []).length > 0;
}

function pickCanonical(a, b) {
  const [first, second] = hasHistory(a) === hasHistory(b) ? [a, b] : hasHistory(a) ? [a, b] : [b, a];
  const firstNamed = Boolean((first.name || '').trim());
  const secondNamed = Boolean((second.name || '').trim());
  if (firstNamed !== secondNamed) return firstNamed ? first : second;
  return first;
}

export function computeDashboardMetrics(users, progressRecords) {
  const now = new Date()
  const todayStart = getStartOfLocalDay(now)
  const weekStart = getStartOfLocalWeek(now)
  const monthStart = getStartOfLocalMonth(now)

  let newToday = 0
  let newThisWeek = 0
  let newThisMonth = 0
  let usersWithUnknownCreatedAt = 0
  let totalCompletedLessons = 0
  const userLessonCounts = {}
  const userCourseCompletions = {}

  const profileRows = users || []
  const byPerson = groupRowsByPerson(users)
  const people = [...byPerson.values()]
  const duplicateProfileRows = profileRows.length - people.length

  for (const u of profileRows) {
    const created = toDate(u.createdAt)
    if (!created || Number.isNaN(created.getTime())) {
      usersWithUnknownCreatedAt++
      console.warn('[adminService] Invalid or missing created_at for profile:', u.id)
      continue
    }
    if (created >= todayStart && created < now) newToday++
    if (created >= weekStart && created < now) newThisWeek++
    if (created >= monthStart && created < now) newThisMonth++
  }

  const uniqueUsersWithProgress = new Set()
  for (const r of progressRecords) {
    if (r.completed) {
      totalCompletedLessons++
      uniqueUsersWithProgress.add(r.userId)
      userLessonCounts[r.userId] = (userLessonCounts[r.userId] || 0) + 1
    }
  }

  for (const u of people) {
    const courses = u.completedCourses || []
    if (courses.length > 0) {
      userCourseCompletions[u.id] = courses.length
    }
  }

  const usersCompletedAnyTrail = Object.keys(userCourseCompletions).length
  const usersCompletedAllTrails = people.filter((u) => {
    const availableTrails = trails.filter((t) => t.status === 'available')
    return availableTrails.every((t) => (u.completedCourses || []).includes(t.id))
  }).length

  let totalProgressSum = 0
  let activeUsersCount = 0
  const accessibleCount = getAccessibleTrails().length
  for (const u of people) {
    const completed = (u.completedLessons || []).length
    const pct = allLessons.length > 0 ? Math.round((completed / allLessons.length) * 100) : 0
    totalProgressSum += pct
    if (completed > 0) activeUsersCount++
  }
  const avgProgress = people.length > 0 ? Math.round(totalProgressSum / people.length) : 0

  const totalTrails = accessibleCount
  const totalModules = allModules.length
  const totalLessons = allLessons.length

  return {
    totalUsers: profileRows.length,
    duplicateProfileRows,
    usersWithUnknownCreatedAt,
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
    const dayEnd = getStartOfLocalDay(new Date(day.getTime() + 86400000))
    const count = progressRecords.filter((r) => {
      if (!r.completed) return false
      const d = toDate(r.completedAt)
      return d && d >= day && d < dayEnd
    }).length
    lessonsPerDay.push({
      date: getLocalDayKey(day).slice(5),
      aulas: count,
    })
  }

  const usersPerDay = []
  for (let i = 29; i >= 0; i--) {
    const day = daysAgo(i)
    const dayEnd = getStartOfLocalDay(new Date(day.getTime() + 86400000))
    const count = users.filter((u) => {
      const d = toDate(u.createdAt)
      return d && d >= day && d < dayEnd
    }).length
    usersPerDay.push({
      date: getLocalDayKey(day).slice(5),
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
    const dayEnd = getStartOfLocalDay(new Date(day.getTime() + 86400000))
    const totalOnDay = users.filter((u) => {
      const d = toDate(u.createdAt)
      return d && d < dayEnd
    }).length
    growthData.push({
      date: getLocalDayKey(day).slice(5),
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
