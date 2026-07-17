import { trails, getTrailById, getNextTrailId } from '../data/trails.js'
import { allLessons, allVideoLessons } from '../data/lessons/index.js'
import { isModuleComplete } from './progressService.js'

function getCourseForTrail(trailId) {
  return trails.find((t) => t.id === trailId)
}

const STATUS_LOCKED = 'locked'
const STATUS_AVAILABLE = 'available'
const STATUS_IN_PROGRESS = 'in_progress'
const STATUS_COMPLETED = 'completed'

/**
 * Trilhas acessíveis: 'available' e 'building' (com aulas publicadas).
 * Exclui 'soon' — sem conteúdo, não deve contar para progresso.
 */
export function getAccessibleTrails() {
  return trails.filter((t) => t.status !== 'soon')
}

/**
 * Total de aulas em trilhas acessíveis.
 */
export function getAccessibleLessonsCount() {
  const accessible = getAccessibleTrails()
  const accessibleIds = new Set(accessible.map((t) => t.id))
  const all = [...allLessons, ...allVideoLessons]
  return all.filter((l) => accessibleIds.has(l.courseId)).length
}

export function computeTrailStatus(trailId, completedLessons, completedCourses, completedQuizzes) {
  const trail = getTrailById(trailId)
  if (!trail) return STATUS_LOCKED
  if (trail.status === 'soon') return STATUS_LOCKED

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
  if (!isTrailUnlocked(trailId, completedCourses)) return STATUS_LOCKED
  return STATUS_AVAILABLE
}

export function isTrailUnlocked(trailId, completedCourses) {
  const trail = getTrailById(trailId)
  if (!trail) return false
  if (!trail.requiredTrail) return true
  return completedCourses.includes(trail.requiredTrail)
}

export function getJourneyProgress(completedCourses, completedLessons = [], completedQuizzes = []) {
  let firstLocked = null
  let currentTrail = null
  let nextTrail = null
  let completedCount = 0

  const accessibleTrails = getAccessibleTrails()

  const journeys = trails
    .sort((a, b) => a.order - b.order)
    .map((trail) => {
      const isUnlocked = isTrailUnlocked(trail.id, completedCourses)
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

      if (!trailCompleted && !isUnlocked && firstLocked === null) {
        firstLocked = trail.id
      }

      return {
        ...trail,
        unlocked: isUnlocked,
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
    firstLocked,
    currentTrail,
    nextTrail,
    completedCount,
    totalCount: totalAccessible,
    percent: totalAccessible > 0 ? Math.round((completedCount / totalAccessible) * 100) : 0,
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
    const lessons = [...allLessons, ...allVideoLessons].filter((l) => l.courseId === trail.id)
    const incomplete = lessons.find((l) => !completedLessons.includes(l.id))
    if (incomplete) return trail
    if (!completedCourses.includes(trail.id)) return trail
  }
  return null
}
