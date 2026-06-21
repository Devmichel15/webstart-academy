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
import { courses as staticCourses } from '../data/courses.js'
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
    difficulty: 'beginner',
    estimatedHours: Math.ceil(course.lessons.reduce((sum, l) => sum + l.duration, 0) / 60),
    totalLessons: course.lessons.length,
    icon: course.icon,
    color: course.color,
    lessons: course.lessons,
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

    const fallback = mapStaticCourses().find((course) => course.id === courseId)
    return fallback || null
  }).catch(() => mapStaticCourses().find((course) => course.id === courseId) || null)
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

    return [{
      id: `${courseId}-main`,
      courseId,
      title: 'Módulos do curso',
      description: 'Conteúdo principal',
      order: 1,
    }]
  }).catch(() => [{
    id: `${courseId}-main`,
    courseId,
    title: 'Módulos do curso',
    description: 'Conteúdo principal',
    order: 1,
  }])
}

export async function getCourseWithLessons(courseId) {
  const course = await getCourseById(courseId)
  if (!course) return null

  const staticCourse = staticCourses.find((item) => item.id === courseId)
  return {
    ...course,
    lessons: staticCourse?.lessons || course.lessons || [],
  }
}
