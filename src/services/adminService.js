import {
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit as firestoreLimit,
  startAfter,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db, app } from '../firebase/firebase.js'
import { trails } from '../data/trails.js'
import { allLessons } from '../data/lessons/index.js'
import { allModules } from '../data/modules/index.js'
import { getAccessibleTrails } from './trailProgressService.js'

const USERS_PER_PAGE = 50

let functionsInstance = null
function getFunctionsInstance() {
  if (!functionsInstance) {
    functionsInstance = getFunctions(app)
  }
  return functionsInstance
}

export async function fetchAllUsersFromCloudFunction() {
  try {
    const fn = getFunctionsInstance()
    const callListAllUsers = httpsCallable(fn, 'listAllUsers')
    const result = await callListAllUsers()
    return result.data.users || []
  } catch (err) {
    console.error('[adminService] Failed to call listAllUsers function:', err)
    return null
  }
}

export function subscribeToAllUsers(callback, onError) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }, onError)
}

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getUsersPage(lastDoc = null) {
  let q
  if (lastDoc) {
    q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      firestoreLimit(USERS_PER_PAGE),
    )
  } else {
    q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(USERS_PER_PAGE),
    )
  }
  const snap = await getDocs(q)
  return {
    users: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === USERS_PER_PAGE,
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

export function subscribeToAllUsersMerged(firestoreCallback, mergeCallback, onError) {
  let firestoreUsers = []
  let cloudUsers = null

  const callMerge = () => {
    const merged = mergeCloudData(firestoreUsers, cloudUsers || [])
    mergeCallback(merged)
  }

  fetchAllUsersFromCloudFunction().then((data) => {
    cloudUsers = data || []
    callMerge()
  }).catch((err) => {
    console.error('[adminService] Cloud function error:', err)
    cloudUsers = []
    callMerge()
  })

  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    firestoreUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    callMerge()
  }, (err) => {
    console.error('[adminService] Firestore subscription error:', err)
    callMerge()
    if (onError) onError(err)
  })
}

export async function getAllProgressRecords() {
  const snap = await getDocs(collection(db, 'user_progress'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export function subscribeToAllProgress(callback, onError) {
  return onSnapshot(collection(db, 'user_progress'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }, onError)
}

function toDate(ts) {
  if (!ts) return null
  if (ts.toDate) return ts.toDate()
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

// ─── REACTIVATION ────────────────────────────────────────────────────────────

/**
 * Invoca a Cloud Function getReactivationUsers para obter
 * a lista de utilizadores elegíveis para email de reativação.
 */
export async function getReactivationUsers() {
  try {
    const fn = getFunctionsInstance()
    const getReactivation = httpsCallable(fn, 'getReactivationUsers')
    const result = await getReactivation()
    return result.data
  } catch (err) {
    console.error('[adminService] getReactivationUsers error:', err)
    throw err
  }
}
