import { supabase } from '../lib/supabase.js'
import { allLessons, getLessonById as getStaticLesson } from '../data/lessons/index.js'
import { getLessonsByModule as getStaticLessonsByModule } from '../data/lessons/index.js'
import { withRetry } from '../utils/retry.js'

function mapLessonRow(row) {
  if (!row) return null
  return {
    id: row.id,
    courseId: row.course_id,
    moduleId: row.module_id,
    title: row.title,
    description: row.content?.substring(0, 200) || row.extra?.description || '',
    duration: row.estimated_time,
    order: row["order"],
    videoUrl: row.extra?.videoUrl || row.extra?.youtubeUrl || '',
    content: row.content,
  }
}

export async function getLessonById(lessonId) {
  return withRetry(async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle()

    if (data) {
      const staticLesson = getStaticLesson(lessonId)
      const mapped = mapLessonRow(data)
      return staticLesson ? { ...staticLesson, ...mapped } : mapped
    }

    return getStaticLesson(lessonId) || null
  }).catch(() => getStaticLesson(lessonId) || null)
}

export async function getLessonsByModule(moduleId) {
  return withRetry(async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)

    if (data && data.length > 0) {
      return data
        .map((row) => {
          const mapped = mapLessonRow(row)
          const staticLesson = getStaticLesson(row.id)
          return staticLesson ? { ...staticLesson, ...mapped } : mapped
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    }

    return getStaticLessonsByModule(moduleId)
  }).catch(() => getStaticLessonsByModule(moduleId))
}

export async function getLessonsByCourse(courseId) {
  const staticLessons = allLessons.filter((lesson) => lesson.courseId === courseId)

  return withRetry(async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)

    if (!data || data.length === 0) return staticLessons

    return data
      .map((row) => {
        const mapped = mapLessonRow(row)
        const staticLesson = getStaticLesson(row.id)
        return staticLesson ? { ...staticLesson, ...mapped } : mapped
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }).catch(() => staticLessons)
}

export function getNextLesson(lessonId, lessons = allLessons) {
  const index = lessons.findIndex((lesson) => lesson.id === lessonId)
  return index >= 0 ? lessons[index + 1] : null
}

export { allLessons }
