import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.js'
import { withRetry } from '../utils/retry.js'
import { getAchievementsWithStatus } from './achievementService.js'

const PUBLIC_FIELDS = [
  'name',
  'username',
  'xp',
  'level',
  'streak',
  'completedLessons',
  'completedExercises',
  'completedProjects',
  'completedCourses',
  'isPublic',
  'photoURL',
]

function sanitizePublicProfile(data) {
  if (!data) return null
  const profile = { id: data.id || data.uid }
  for (const field of PUBLIC_FIELDS) {
    if (data[field] !== undefined) profile[field] = data[field]
  }
  profile.completedCount = (data.completedLessons || []).length
  return profile
}

export async function getPublicProfileByUsername(username) {
  return withRetry(async () => {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username),
      limit(1),
    )
    const snap = await getDocs(q)
    if (snap.empty) return null

    const docSnap = snap.docs[0]
    const data = { id: docSnap.id, ...docSnap.data() }
    if (data.isPublic === false) return null

    const achievements = await getAchievementsWithStatus(docSnap.id, data)
    const unlocked = achievements.filter((a) => a.unlocked)

    return {
      ...sanitizePublicProfile(data),
      achievements: unlocked,
      latestBadge: unlocked[unlocked.length - 1]?.title || null,
    }
  }).catch(() => null)
}

export async function getGlobalRanking(limitCount = 50) {
  return withRetry(async () => {
    const q = query(
      collection(db, 'users'),
      orderBy('xp', 'desc'),
      limit(limitCount),
    )
    const snap = await getDocs(q)
    return snap.docs
      .map((item, index) => {
        const data = item.data()
        if (data.isPublic === false) return null
        return {
          rank: index + 1,
          uid: item.id,
          name: data.name,
          username: data.username,
          xp: data.xp || 0,
          level: data.level || 1,
          streak: data.streak || 0,
        }
      })
      .filter(Boolean)
  }).catch(() => [])
}

export function getUserRankPercentile(rank, total) {
  if (!total || !rank) return null
  const topPercent = Math.round((rank / total) * 100)
  return Math.max(1, 100 - topPercent)
}
