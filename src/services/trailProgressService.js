import { trails, getTrailById } from '../data/trails.js'
import { allLessons, allVideoLessons } from '../data/lessons/index.js'
import { isModuleComplete } from './progressService.js'

function getCourseForTrail(trailId) {
  return trails.find((t) => t.id === trailId)
}

const STATUS_AVAILABLE = 'available'
const STATUS_IN_PROGRESS = 'in_progress'
const STATUS_COMPLETED = 'completed'

export function getAccessibleTrails() {
  return trails.filter((t) => t.status !== 'soon')
}

export function getAccessibleLessonsCount() {
  const accessible = getAccessibleTrails()
  const accessibleIds = new Set(accessible.map((t) => t.id))
  const all = [...allLessons, ...allVideoLessons]
  return all.filter((l) => accessibleIds.has(l.courseId)).length
}

export function computeTrailStatus(trailId, completedLessons, completedCourses, completedQuizzes) {
  const trail = getTrailById(trailId)
  if (!trail) return STATUS_AVAILABLE
  if (trail.status === 'soon') return STATUS_AVAILABLE

  if (completedCourses.includes(trailId)) return STATUS_COMPLETED

  const course = getCourseForTrail(trailId)
  if (course?.modules) {
    const allModulesDone = course.modules.every((moduleId) =>
      isModuleComplete(completedLessons || [], completedQuizzes || [], moduleId)
    )
    if (allModulesDone) return STATUS_COMPLETED
  }

  const lessons = [...allLessons, ...allVideoLessons].filter((l) => l.courseId === trailId)
  const completedInTrail = lessons.filter((l) => completedLessons.includes(l.id))
  const allLessonsDone = lessons.length > 0 && completedInTrail.length === lessons.length

  if (allLessonsDone) return STATUS_COMPLETED
  if (completedInTrail.length > 0) return STATUS_IN_PROGRESS
  return STATUS_AVAILABLE
}

export function isTrailUnlocked() {
  return true
}

export function getJourneyProgress(completedCourses, completedLessons = [], completedQuizzes = []) {
  let currentTrail = null
  let nextTrail = null
  let completedCount = 0

  const accessibleTrails = getAccessibleTrails()

  const journeys = trails
    .sort((a, b) => a.order - b.order)
    .map((trail) => {
      const isCompleted = completedCourses.includes(trail.id)
      const course = getCourseForTrail(trail.id)
      let trailCompleted = isCompleted

      if (!trailCompleted && trail.status !== 'soon') {
        if (course?.modules) {
          trailCompleted = course.modules.every((moduleId) =>
            isModuleComplete(completedLessons || [], completedQuizzes || [], moduleId)
          )
        } else {
          const lessons = [...allLessons, ...allVideoLessons].filter((l) => l.courseId === trail.id)
          const completedInTrail = lessons.filter((l) => completedLessons.includes(l.id))
          trailCompleted = lessons.length > 0 && completedInTrail.length === lessons.length
        }
      }

      if (trailCompleted && trail.status !== 'soon') completedCount++

      return {
        ...trail,
        unlocked: true,
        completed: trailCompleted,
      }
    })

  const totalAccessible = accessibleTrails.length
  const currentIndex = completedCount > 0 ? completedCount - 1 : 0
  const nextIndex = completedCount < totalAccessible ? completedCount : totalAccessible - 1

  currentTrail = trails[currentIndex]?.id || null
  nextTrail = trails[nextIndex]?.id || null

  return {
    journeys,
    firstLocked: null,
    currentTrail,
    nextTrail,
    completedCount,
    totalCount: totalAccessible,
    percent: totalAccessible > 0 ? Math.round((completedCount / totalAccessible) * 100) : 0,
  }
}

export function getAvailableTrails() {
  return [...trails].sort((a, b) => a.order - b.order)
}

export function getRecommendedTrail(completedCourses, completedLessons) {
  const available = getAvailableTrails()
  for (const trail of available) {
    if (trail.status === 'soon') continue
    const lessons = [...allLessons, ...allVideoLessons].filter((l) => l.courseId === trail.id)
    const incomplete = lessons.find((l) => !completedLessons.includes(l.id))
    if (incomplete) return trail
    if (!completedCourses.includes(trail.id)) return trail
  }
  return null
}
