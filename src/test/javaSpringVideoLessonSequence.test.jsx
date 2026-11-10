import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import VideoLesson from '../pages/VideoLesson.jsx'

const progressMocks = vi.hoisted(() => ({
  completedLessonIds: [],
  completeLesson: vi.fn(),
  visitLesson: vi.fn(),
  getCourseProgress: vi.fn(() => 0),
  isLessonCompleted: vi.fn(),
  loading: false,
}))

vi.mock('../hooks/useProgress.js', () => ({
  useProgress: () => progressMocks,
}))

vi.mock('../components/seo/SEO', () => ({ SEO: () => null }))
vi.mock('../components/layout/Header', () => ({ Header: () => null }))

function CurrentPath() {
  const location = useLocation()
  return <output data-testid="current-path">{location.pathname}</output>
}

function renderVideoLesson(lessonId) {
  return render(
    <MemoryRouter initialEntries={[`/video-aula/${lessonId}`]}>
      <Routes>
        <Route path="/video-aula/:lessonId" element={<VideoLesson />} />
        <Route
          path="/trilhas/:courseId/modulo/:moduleId"
          element={<p>Módulo concluído</p>}
        />
      </Routes>
      <CurrentPath />
    </MemoryRouter>,
  )
}

describe('Java + Spring video sequence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    progressMocks.completedLessonIds = []
    progressMocks.loading = false
    progressMocks.completeLesson.mockResolvedValue({})
    progressMocks.isLessonCompleted.mockImplementation((lessonId) =>
      progressMocks.completedLessonIds.includes(lessonId),
    )
  })

  it('redirects a direct link to the first incomplete lesson', async () => {
    renderVideoLesson('java-spring-vid-3')

    await waitFor(() => {
      expect(screen.getByTestId('current-path').textContent).toBe(
        '/video-aula/java-spring-vid-1',
      )
    })
    const firstVideo = await screen.findByTitle(
      'Curso de PROGRAMAÇÃO JAVA para INICIANTES | Fundamentos + Programação Orientada Objetos',
    )
    expect(firstVideo.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/nODe5lFcGpg',
    )
  })

  it('allows continuing at the next lesson after earlier lessons are completed', async () => {
    progressMocks.completedLessonIds = ['java-spring-vid-1', 'java-spring-vid-2']
    renderVideoLesson('java-spring-vid-3')

    const thirdVideo = await screen.findByTitle(
      'Entendendo COLETOR DE LIXO DO JAVA (memória Heap, Stack, Garbage Collector)',
    )
    expect(thirdVideo.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/cgUfurMJosE',
    )
    expect(thirdVideo.className).toContain('w-full')
    expect(thirdVideo.parentElement.style.paddingBottom).toBe('56.25%')
    expect(screen.getByTestId('current-path').textContent).toBe(
      '/video-aula/java-spring-vid-3',
    )
  })
})
