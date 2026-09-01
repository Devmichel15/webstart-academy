import { supabase } from '../lib/supabase.js'
import { trails as staticCourses } from '../data/trails.js'
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

function mapCourseRow(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnail: row.thumbnail,
    difficulty: row.difficulty,
    estimatedHours: row.estimated_hours,
    totalLessons: row.total_lessons,
    modules: row.extra?.modules || [],
    icon: row.icon,
    color: row.color,
    status: row.status,
  }
}

function mapModuleRow(row) {
  if (!row) return null
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    order: row["order"],
    lessons: row.extra?.lessons || [],
    quiz: row.extra?.quiz || null,
  }
}

export async function getCourses() {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('title')

    if (error || !data || data.length === 0) {
      const fallback = mapStaticCourses()
      setCache(CACHE_KEY, fallback)
      return fallback
    }

    const courses = data.map(mapCourseRow)
    setCache(CACHE_KEY, courses)
    return courses
  }).catch(() => {
    const cached = getCache(CACHE_KEY)
    return cached || mapStaticCourses()
  })
}

export function subscribeToCourses(callback, onError) {
  const channel = supabase
    .channel('courses-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'courses' },
      async () => {
        try {
          const courses = await getCourses()
          callback(courses)
        } catch (err) {
          onError?.(err)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        getCourses()
          .then(callback)
          .catch(() => {
            callback(getCache(CACHE_KEY) || mapStaticCourses())
            onError?.()
          })
      }
    })

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function getCourseById(courseId) {
  return withRetry(async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle()

    if (data) return mapCourseRow(data)

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
    const { data } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)

    if (data && data.length > 0) {
      return data
        .map(mapModuleRow)
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
