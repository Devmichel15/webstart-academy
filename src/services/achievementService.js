import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.js'
import { achievements as staticAchievements } from '../data/achievements.js'
import { allLessons, courses as staticCourses } from '../data/courses.js'
import { withRetry } from '../utils/retry.js'
import { addXpToUser, getUserProfile } from './userService.js'

export async function getAchievements() {
  return withRetry(async () => {
    const snap = await getDocs(collection(db, 'achievements'))
    if (snap.empty) {
      return staticAchievements.map((item) => ({
        ...item,
        xpReward: item.xpReward || 0,
        requirement: item.requirement || item.description,
      }))
    }

    return snap.docs.map((item) => ({ id: item.id, ...item.data() }))
  }).catch(() => staticAchievements)
}

export async function getUserAchievements(userId) {
  return withRetry(async () => {
    const q = query(collection(db, 'user_achievements'), where('userId', '==', userId))
    const snap = await getDocs(q)
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }))
  })
}

function evaluateAchievement(achievement, user) {
  const completedLessons = user.completedLessons || []

  if (achievement.type === 'lessons') {
    return completedLessons.length >= achievement.target
  }

  if (achievement.type === 'xp') {
    return (user.xp || 0) >= achievement.target
  }

  if (achievement.type === 'streak') {
    return (user.streak || 0) >= achievement.target
  }

  if (achievement.type === 'course') {
    const course = staticCourses.find((item) => item.id === achievement.courseId)
    if (!course) return false
    return course.lessons.every((lesson) => completedLessons.includes(lesson.id))
  }

  return false
}

export async function checkAndUnlockAchievements(userId) {
  const user = await getUserProfile(userId)
  if (!user) return []

  const achievements = await getAchievements()
  const userAchievements = await getUserAchievements(userId)
  const unlockedIds = userAchievements.map((item) => item.achievementId)
  const newlyUnlocked = []

  for (const achievement of achievements) {
    if (unlockedIds.includes(achievement.id)) continue
    if (!evaluateAchievement(achievement, user)) continue

    const ref = doc(db, 'user_achievements', `${userId}_${achievement.id}`)
    await setDoc(ref, {
      userId,
      achievementId: achievement.id,
      earnedAt: serverTimestamp(),
    })

    if (achievement.xpReward) {
      await addXpToUser(userId, achievement.xpReward)
    }

    newlyUnlocked.push(achievement)
  }

  return newlyUnlocked
}

export async function getAchievementsWithStatus(userId, user) {
  const achievements = await getAchievements()
  const userAchievements = userId ? await getUserAchievements(userId) : []
  const unlockedIds = new Set(userAchievements.map((item) => item.achievementId))

  return achievements.map((achievement) => ({
    ...achievement,
    unlocked: unlockedIds.has(achievement.id) || evaluateAchievement(achievement, user || {}),
  }))
}
