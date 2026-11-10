import { htmlLessons } from './html-lessons.js'
import { cssLessons } from './css-lessons.js'
import { fundamentosLessons } from './fundamentos-lessons.js'
import { videoLessons } from './video-lessons.js'
import { javascriptLessons } from './javascript-lessons.js'
import { phpLessons } from './php-lessons.js'
import { gitLessons } from './git-lessons.js'
import { pythonLessons } from './python-lessons.js'
import { reactLessons } from './react-lessons.js'
import { javaSpringLessons } from './java-spring-lessons.js'

// fundamentosLessons são agora videoLessons (Lógica de Programação — Curso em Vídeo)
export { htmlLessons, cssLessons, fundamentosLessons, videoLessons, javascriptLessons, phpLessons, gitLessons, pythonLessons, reactLessons, javaSpringLessons }
export const allLessons = [...htmlLessons, ...cssLessons, ...fundamentosLessons, ...javascriptLessons, ...phpLessons, ...gitLessons]
export const allVideoLessons = [...fundamentosLessons, ...videoLessons, ...javascriptLessons, ...phpLessons, ...gitLessons, ...pythonLessons, ...reactLessons, ...javaSpringLessons]

function getCombinedLessons() {
  const lessonsById = new Map(
    [...allLessons, ...allVideoLessons].map((lesson) => [lesson.id, lesson]),
  )
  return [...lessonsById.values()]
}

export function getLessonById(id) {
  return allLessons.find((l) => l.id === id) || allVideoLessons.find((l) => l.id === id) || null
}

export function getVideoLessonById(id) {
  return allVideoLessons.find((l) => l.id === id) || null
}

export function getLessonsByModule(moduleId) {
  return getCombinedLessons()
    .filter((lesson) => lesson.moduleId === moduleId)
    .sort((a, b) => a.order - b.order)
}

export function getVideoLessonsByModule(moduleId) {
  return allVideoLessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order)
}

export function getLessonsByCourse(courseId) {
  return getCombinedLessons()
    .filter((lesson) => lesson.courseId === courseId)
    .sort((a, b) => a.order - b.order)
}

export function getVideoLessonsByCourse(courseId) {
  return allVideoLessons.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order)
}
