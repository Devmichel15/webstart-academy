import { getTrailById } from '../data/trails.js'
import { PREMIUM_COURSE_IDS } from '../config/premium.js'

export function isPremiumCourse(courseId) {
  const trail = getTrailById(courseId)
  return trail?.isPremium === true || PREMIUM_COURSE_IDS.includes(courseId)
}

export function hasPremiumAccess(courseId, profile) {
  if (!isPremiumCourse(courseId)) return true
  if (profile?.isPremium) return true
  if (profile?.purchasedCourses?.includes(courseId)) return true
  return false
}
