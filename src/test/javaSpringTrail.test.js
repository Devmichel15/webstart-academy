import { describe, expect, it } from 'vitest'
import {
  allVideoLessons,
  getLessonsByModule,
  getVideoLessonsByCourse,
} from '../data/lessons/index.js'
import { courses as catalogCourses } from '../data/courses.js'
import { getModuleData, getTrailById } from '../data/trails.js'
import {
  getFirstIncompleteLesson,
  isLessonUnlockedInSequence,
} from '../utils/lessonSequence.js'

const expectedVideoIds = [
  'nODe5lFcGpg',
  'jLropHUgI1A',
  'cgUfurMJosE',
  'YY_hf0FOIcU',
  'GmbK-O3v3Gg',
  '5w-YCcOjPD0',
  'LX5jaieOIAk',
  'd0KaNzAMVO4',
  'tJCyNV1G0P4',
  'wp5PjmwYymA',
  'bEkCdlrxF54',
  'yACzWg9gUGM',
  'n377IabhD-o',
  '71WGVa79BWE',
  'C7OyP5X3bUU',
]

describe('trilha Java + Spring', () => {
  const lessons = getVideoLessonsByCourse('java-spring')
  const trail = getTrailById('java-spring')

  it('is available with five ordered modules and the 15 public videos in playlist order', () => {
    expect(trail).toMatchObject({
      title: 'Java + Spring: Fundamentos a Back-end em Produção',
      instructor: 'Fernanda Kipper',
      difficulty: 'intermediate',
      estimatedHours: 16,
      status: 'available',
      requiredTrail: null,
    })
    expect(catalogCourses.find((course) => course.id === 'java-spring')?.lessons)
      .toHaveLength(15)
    expect(getLessonsByModule('java-spring-mod-cloud')).toHaveLength(3)
    expect(lessons.map((lesson) => lesson.youtubeUrl.split('v=')[1])).toEqual(expectedVideoIds)
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(15)
    expect(lessons.every((lesson) => allVideoLessons.includes(lesson))).toBe(true)
    expect(lessons.map((lesson) => getModuleData(lesson.moduleId)?.lessons.length)).toEqual([
      3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 1,
    ])
    expect(trail.modules.map((moduleId) => getModuleData(moduleId).lessons.length)).toEqual([
      3, 4, 4, 3, 1,
    ])
  })

  it('uses the YouTube ID for each responsive embed and preserves source durations', () => {
    expect(lessons.every((lesson) => {
      const videoId = lesson.youtubeUrl.split('v=')[1]
      return lesson.embedUrl === `https://www.youtube.com/embed/${videoId}`
    })).toBe(true)
    expect(lessons.reduce((total, lesson) => {
      const durationParts = lesson.duration.split(':').map(Number)
      const seconds = durationParts.pop()
      const minutes = durationParts.pop()
      const hours = durationParts.pop() || 0
      return total + hours * 3600 + minutes * 60 + seconds
    }, 0)).toBe(56268)
    expect(lessons.map((lesson) => lesson.embedUrl)).not.toContain(
      'https://www.youtube.com/embed/QU27Qsr9rDM',
    )
    expect(lessons.map((lesson) => lesson.embedUrl)).not.toContain(
      'https://www.youtube.com/embed/l9k_tWRTX7k',
    )
    expect(lessons.map((lesson) => lesson.embedUrl)).not.toContain(
      'https://www.youtube.com/embed/v6yF2V2eSTE',
    )
  })

  it('unlocks lessons in order and resumes at the first incomplete lesson', () => {
    const completed = new Set()
    const isCompleted = (lessonId) => completed.has(lessonId)

    expect(isLessonUnlockedInSequence(lessons, lessons[0].id, isCompleted)).toBe(true)
    expect(isLessonUnlockedInSequence(lessons, lessons[1].id, isCompleted)).toBe(false)
    expect(getFirstIncompleteLesson(lessons, isCompleted)).toBe(lessons[0])

    completed.add(lessons[0].id)
    expect(isLessonUnlockedInSequence(lessons, lessons[1].id, isCompleted)).toBe(true)
    expect(isLessonUnlockedInSequence(lessons, lessons[2].id, isCompleted)).toBe(false)
    expect(getFirstIncompleteLesson(lessons, isCompleted)).toBe(lessons[1])

    completed.add(lessons[1].id)
    expect(isLessonUnlockedInSequence(lessons, lessons[2].id, isCompleted)).toBe(true)
  })
})
