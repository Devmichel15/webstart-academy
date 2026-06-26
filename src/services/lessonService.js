import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.js'
import { allLessons, getLessonById as getStaticLesson } from '../data/lessons/index.js'
import { getLessonsByModule as getStaticLessonsByModule } from '../data/lessons/index.js'
import { withRetry } from '../utils/retry.js'

export async function getLessonById(lessonId) {
  return withRetry(async () => {
    const snap = await getDoc(doc(db, 'lessons', lessonId))
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() }
      const staticLesson = getStaticLesson(lessonId)
      return staticLesson ? { ...staticLesson, ...data } : data
    }

    return getStaticLesson(lessonId) || null
  }).catch(() => getStaticLesson(lessonId) || null)
}

export async function getLessonsByModule(moduleId) {
  return withRetry(async () => {
    const q = query(
      collection(db, 'lessons'),
      where('moduleId', '==', moduleId),
    )
    const snap = await getDocs(q)

    if (!snap.empty) {
      return snap.docs
        .map((item) => {
          const data = { id: item.id, ...item.data() }
          const staticLesson = getStaticLesson(item.id)
          return staticLesson ? { ...staticLesson, ...data } : data
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    }

    return getStaticLessonsByModule(moduleId)
  }).catch(() => getStaticLessonsByModule(moduleId))
}

export async function getLessonsByCourse(courseId) {
  const staticLessons = allLessons.filter((lesson) => lesson.courseId === courseId)

  return withRetry(async () => {
    const q = query(
      collection(db, 'lessons'),
      where('courseId', '==', courseId),
    )
    const snap = await getDocs(q)

    if (snap.empty) return staticLessons

    return snap.docs
      .map((item) => {
        const data = { id: item.id, ...item.data() }
        const staticLesson = getStaticLesson(item.id)
        return staticLesson ? { ...staticLesson, ...data } : data
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }).catch(() => staticLessons)
}

export function getNextLesson(lessonId, lessons = allLessons) {
  const index = lessons.findIndex((lesson) => lesson.id === lessonId)
  return index >= 0 ? lessons[index + 1] : null
}

export { allLessons }
