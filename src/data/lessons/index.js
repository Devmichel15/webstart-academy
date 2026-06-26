import { htmlLessons } from './html-lessons.js'
import { cssLessons } from './css-lessons.js'
import { fundamentosLessons } from './fundamentos-lessons.js'

export { htmlLessons, cssLessons, fundamentosLessons }
export const allLessons = [...htmlLessons, ...cssLessons, ...fundamentosLessons]

export function getLessonById(id) {
  return allLessons.find((l) => l.id === id) || null
}

export function getLessonsByModule(moduleId) {
  return allLessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order)
}

export function getLessonsByCourse(courseId) {
  return allLessons.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order)
}
