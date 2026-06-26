import { trails, getTrailById, getNextTrailId } from '../data/trails.js'
import { allLessons } from '../data/lessons/index.js'

const STATUS_LOCKED = 'locked'
const STATUS_AVAILABLE = 'available'
const STATUS_IN_PROGRESS = 'in_progress'
const STATUS_COMPLETED = 'completed'

export function computeTrailStatus(trailId, completedLessons, completedCourses) {
  const trail = getTrailById(trailId)
  if (!trail) return STATUS_LOCKED

  const lessons = allLessons.filter((l) => l.courseId === trailId)
  const completedInTrail = lessons.filter((l) => completedLessons.includes(l.id))

  const isCompleted = completedCourses.includes(trailId)
  const hasProgress = completedInTrail.length > 0
  const allDone = lessons.length > 0 && completedInTrail.length === lessons.length

  if (isCompleted || allDone) return STATUS_COMPLETED
  if (hasProgress) return STATUS_IN_PROGRESS
  if (!isTrailUnlocked(trailId, completedCourses)) return STATUS_LOCKED
  return STATUS_AVAILABLE
}

export function isTrailUnlocked(trailId, completedCourses) {
  const trail = getTrailById(trailId)
  if (!trail) return false
  if (!trail.requiredTrail) return true
  return completedCourses.includes(trail.requiredTrail)
}

export function getJourneyProgress(completedCourses) {
  let firstLocked = null
  let currentTrail = null
  let nextTrail = null
  let completedCount = 0

  const journeys = trails
    .sort((a, b) => a.order - b.order)
    .map((trail) => {
      const isUnlocked = isTrailUnlocked(trail.id, completedCourses)
      const isCompleted = completedCourses.includes(trail.id)

      if (isCompleted) completedCount++

      if (!isCompleted && !isUnlocked && firstLocked === null) {
        firstLocked = trail.id
      }

      return {
        ...trail,
        unlocked: isUnlocked,
        completed: isCompleted,
      }
    })

  const currentIndex = completedCount > 0 ? completedCount - 1 : 0
  const nextIndex = completedCount < trails.length ? completedCount : trails.length - 1

  currentTrail = trails[currentIndex]?.id || null
  nextTrail = trails[nextIndex]?.id || null

  return {
    journeys,
    firstLocked,
    currentTrail,
    nextTrail,
    completedCount,
    totalCount: trails.length,
    percent: Math.round((completedCount / trails.length) * 100),
  }
}

export function getAvailableTrails(completedCourses) {
  return trails
    .filter((t) => isTrailUnlocked(t.id, completedCourses))
    .sort((a, b) => a.order - b.order)
}

export function getRecommendedTrail(completedCourses, completedLessons) {
  const available = getAvailableTrails(completedCourses)
  for (const trail of available) {
    const lessons = allLessons.filter((l) => l.courseId === trail.id)
    const incomplete = lessons.find((l) => !completedLessons.includes(l.id))
    if (incomplete) return trail
    if (!completedCourses.includes(trail.id)) return trail
  }
  return null
}
