import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.js'
import { courses as staticCourses } from '../data/roadmaps.js'
import { getLessonsByCourse } from '../data/lessons/index.js'
import { getCache, setCache } from '../utils/cache.js'
import { withRetry } from '../utils/retry.js'

const CACHE_KEY = 'courses'

function mapStaticCourses() {
  return staticCourses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.id,
    description: course.description,
    thumbnail: '',
    difficulty: course.difficulty || 'beginner',
    estimatedHours: course.estimatedHours || 0,
    totalLessons: getLessonsByCourse(course.id).length,
    modules: course.modules || [],
    icon: course.icon,
    color: course.color,
    completion: course.completion,
    lessons: getLessonsByCourse(course.id),
  }))
}

export async function getCourses() {
  return withRetry(async () => {
    const snap = await getDocs(query(collection(db, 'courses'), orderBy('title')))
    if (snap.empty) {
      const fallback = mapStaticCourses()
      setCache(CACHE_KEY, fallback)
      return fallback
    }

    const courses = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
    setCache(CACHE_KEY, courses)
    return courses
  }).catch(() => {
    const cached = getCache(CACHE_KEY)
    return cached || mapStaticCourses()
  })
}

export function subscribeToCourses(callback, onError) {
  const q = query(collection(db, 'courses'), orderBy('title'))

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        const fallback = mapStaticCourses()
        callback(fallback)
        return
      }
      callback(snap.docs.map((item) => ({ id: item.id, ...item.data() })))
    },
    () => {
      callback(getCache(CACHE_KEY) || mapStaticCourses())
      onError?.()
    },
  )
}

export async function getCourseById(courseId) {
  return withRetry(async () => {
    const snap = await getDoc(doc(db, 'courses', courseId))
    if (snap.exists()) return { id: snap.id, ...snap.data() }

    const fallback = staticCourses.find((course) => course.id === courseId)
    if (fallback) {
      const lessons = getLessonsByCourse(courseId)
      return { ...fallback, lessons, totalLessons: lessons.length }
    }
    return null
  }).catch(() => {
    const fallback = staticCourses.find((course) => course.id === courseId)
    if (fallback) {
      const lessons = getLessonsByCourse(courseId)
      return { ...fallback, lessons, totalLessons: lessons.length }
    }
    return null
  })
}

export async function getModulesByCourse(courseId) {
  return withRetry(async () => {
    const q = query(
      collection(db, 'modules'),
      where('courseId', '==', courseId),
    )
    const snap = await getDocs(q)

    if (!snap.empty) {
      return snap.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    }

    const { getModulesByCourse } = await import('../data/modules/index.js')
    return getModulesByCourse(courseId)
  }).catch(async () => {
    const { getModulesByCourse } = await import('../data/modules/index.js')
    return getModulesByCourse(courseId)
  })
}

export async function getCourseWithLessons(courseId) {
  const course = await getCourseById(courseId)
  if (!course) return null

  const lessons = getLessonsByCourse(courseId)
  return {
    ...course,
    lessons,
  }
}
