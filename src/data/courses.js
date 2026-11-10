import { trails as sourceTrails } from './trails.js'
import {
  allLessons as newLessons,
  getLessonById as getNewLessonById,
  getLessonsByCourse as getNewLessonsByCourse,
} from './lessons/index.js'

export const allLessons = newLessons

export const courses = sourceTrails.map((c) => ({
  ...c,
  lessons: getNewLessonsByCourse(c.id),
}))

export function getLessonById(lessonId) {
  return getNewLessonById(lessonId)
}

export function getCourseById(courseId) {
  return courses.find((course) => course.id === courseId)
}

export function getNextLesson(lessonId) {
  const index = allLessons.findIndex((lesson) => lesson.id === lessonId)
  return index >= 0 ? allLessons[index + 1] : null
}
