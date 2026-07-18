import { htmlLessons } from './html-lessons.js'
import { cssLessons } from './css-lessons.js'
import { fundamentosLessons } from './fundamentos-lessons.js'
import { videoLessons } from './video-lessons.js'
import { javascriptLessons } from './javascript-lessons.js'

export { htmlLessons, cssLessons, fundamentosLessons, videoLessons, javascriptLessons }
export const allLessons = [...htmlLessons, ...cssLessons, ...fundamentosLessons, ...javascriptLessons]
export const allVideoLessons = [...videoLessons, ...javascriptLessons]

export function getLessonById(id) {
  return allLessons.find((l) => l.id === id) || allVideoLessons.find((l) => l.id === id) || null
}

export function getVideoLessonById(id) {
  return allVideoLessons.find((l) => l.id === id) || null
}

export function getLessonsByModule(moduleId) {
  return allLessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order)
}

export function getVideoLessonsByModule(moduleId) {
  return allVideoLessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order)
}

export function getLessonsByCourse(courseId) {
  return allLessons.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order)
}

export function getVideoLessonsByCourse(courseId) {
  return allVideoLessons.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order)
}
