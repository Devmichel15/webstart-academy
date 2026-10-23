import { describe, expect, it } from 'vitest'
import { reactLessons } from '../data/lessons/react-lessons.js'
import { reactModules } from '../data/modules/react-modules.js'
import { getTrailById, isOfficialTrail, trails } from '../data/trails.js'
import { allVideoLessons } from '../data/lessons/index.js'

const officialVideoIds = [
  'Adlyk4PV6zE',
  'TiRMcV0yuMk',
  'XjJK7Gc_TDQ',
  'q7X3F-O_ccA',
  '_XIuODDXM8o',
]

describe('React video lessons', () => {
  it('keeps the verified video ID, original URL, and embed URL in sync', () => {
    expect(reactLessons).toHaveLength(officialVideoIds.length)

    const videoIds = reactLessons.map((lesson) => {
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

  it('registers useEffect na Prática as Aula 05, immediately after Aula 04', () => {
    const module = reactModules.find((item) => item.id === 'react-mod-interatividade')
    const aula05 = reactLessons.find((lesson) => lesson.id === 'react-vid-5')

    expect(aula05).toMatchObject({
      title: 'useEffect na Prática',
      courseId: 'react',
      moduleId: 'react-mod-interatividade',
      youtubeUrl: 'https://www.youtube.com/watch?v=_XIuODDXM8o',
      embedUrl: 'https://www.youtube.com/embed/_XIuODDXM8o',
      order: 3,
    })
    expect(module.lessons.slice(-2)).toEqual(['react-vid-4', 'react-vid-5'])
  })

  it('keeps the final weather project pending after Aula 05', () => {
    const trail = getTrailById('react')
    const finalProject = trail.completion?.finalProject

    expect(finalProject).toMatchObject({
      title: 'Aplicação de Previsão Meteorológica',
      status: 'pending',
    })
    expect(finalProject.stack).toEqual([
      'React',
      'Vite',
      'JavaScript',
      'Tailwind CSS',
      'OpenWeather API',
    ])
  })

  it('references every video lesson exactly once across the modules', () => {
    const moduleLessonIds = reactModules.flatMap((module) => module.lessons)

    expect(moduleLessonIds).toHaveLength(reactLessons.length)
    expect(new Set(moduleLessonIds).size).toBe(moduleLessonIds.length)
    expect(moduleLessonIds).toEqual(reactLessons.map((lesson) => lesson.id))
  })

  it('registers the ReactJS trail as an available official WebStart production', () => {
    const trail = getTrailById('react')

    expect(trail).not.toBeNull()
    expect(trail.status).toBe('available')
    expect(trail.origin).toBe('webstart')
    expect(trail.instructor).toBe('Michel César')
    expect(trail.modules).toEqual(reactModules.map((module) => module.id))
  })

  it('exposes the React lessons through the shared video lesson registry', () => {
    const videoIds = new Set(allVideoLessons.map((lesson) => lesson.id))
    for (const lesson of reactLessons) {
      expect(videoIds.has(lesson.id)).toBe(true)
    }
  })

  it('marks only the WebStart production trails as official', () => {
    const official = trails.filter((trail) => isOfficialTrail(trail)).map((trail) => trail.id)

    expect(official).toEqual(['react'])
  })
})
