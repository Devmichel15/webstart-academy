import { describe, expect, it } from 'vitest'
import { pythonLessons } from '../data/lessons/python-lessons.js'
import { pythonModules } from '../data/modules/python-modules.js'

const officialVideoIds = [
  'S9uPNppGsGo',
  'Mp0vhMDI7fA',
  'VuKvR1J2LQE',
  '31llNGKWDdo',
  'ElRd0cbXIv4',
  'hdDHg1p3YVc',
  'Vw6gLypRKmY',
  'oOUyhGNib2Q',
  'a7DH88vk2Sk',
  'K10u3XIf1-Q',
  '0hBIhkcA8O8',
  'nJkVHusJp6E',
  'j9bYDjaAYzw',
  'cL4YDtFnCt4',
  'LH6OIn2lBaI',
  '1OFp_-R2B2A',
  '0LB3FSfjvao',
  'N1hTsbW50eM',
  'YV_JQmZNFsk',
  'ZWj8o692qGY',
  'ezfr9d7wd_k',
  'etjJ_4Eqrk8',
  's3r8_Aug4y8',
]

describe('Python video lessons', () => {
  it('keeps the verified video ID, original URL, and embed URL in sync', () => {
    expect(pythonLessons).toHaveLength(officialVideoIds.length)

    const videoIds = pythonLessons.map((lesson) => {
      const originalUrl = new URL(lesson.youtubeUrl)
      const videoId = originalUrl.searchParams.get('v')

      expect(lesson.youtubeUrl, lesson.id).toMatch(/^https:\/\/www\.youtube\.com\/watch\?/)
      expect(videoId, lesson.id).toMatch(/^[A-Za-z0-9_-]{11}$/)
      expect(lesson.embedUrl, lesson.id).toBe(`https://www.youtube.com/embed/${videoId}`)

      return videoId
    })

    expect(videoIds).toEqual(officialVideoIds)
    expect(new Set(videoIds).size).toBe(videoIds.length)
  })

  it('references every video lesson exactly once across the existing modules', () => {
    const moduleLessonIds = pythonModules.flatMap((module) => module.lessons)

    expect(moduleLessonIds).toHaveLength(pythonLessons.length)
    expect(new Set(moduleLessonIds).size).toBe(moduleLessonIds.length)
    expect(moduleLessonIds).toEqual(pythonLessons.map((lesson) => lesson.id))
  })
})
