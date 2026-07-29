import { getAccessibleTrails } from '../services/trailProgressService.js'
import { getCourseProgressPercent } from '../services/progressService.js'

export function calculateTrailCompletionRate(completedCourses) {
  const accessible = getAccessibleTrails()
  const total = accessible.length
  if (total === 0) return 0
  const completed = accessible.filter((t) => (completedCourses || []).includes(t.id)).length
  return Math.round((completed / total) * 100)
}

export function calculateAverageStartedTrailProgress(completedLessons, completedQuizzes) {
  const accessible = getAccessibleTrails()
  const started = []
  for (const trail of accessible) {
    const progress = getCourseProgressPercent(completedLessons || [], completedQuizzes || [], trail.id)
    if (progress > 0) {
      started.push(progress)
    }
  }
  if (started.length === 0) return 0
  const sum = started.reduce((acc, p) => acc + p, 0)
  return Math.round(sum / started.length)
}

export function getStartedTrailsCount(completedLessons, completedQuizzes) {
  const accessible = getAccessibleTrails()
  let count = 0
  for (const trail of accessible) {
    const progress = getCourseProgressPercent(completedLessons || [], completedQuizzes || [], trail.id)
    if (progress > 0) count++
  }
  return count
}
