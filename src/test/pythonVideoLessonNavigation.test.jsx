import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import VideoLesson from '../pages/VideoLesson.jsx'

const progressMocks = vi.hoisted(() => ({
  completeLesson: vi.fn(),
  visitLesson: vi.fn(),
  getCourseProgress: vi.fn(() => 0),
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

function renderVideoLesson() {
  return render(
    <MemoryRouter initialEntries={['/video-aula/python-vid-1']}>
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

describe('Python video lesson navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    progressMocks.completeLesson.mockResolvedValue({})
  })

  it('plays the selected embed, completes before going forward, and navigates back', async () => {
    const user = userEvent.setup()
    renderVideoLesson()

    const firstVideo = await screen.findByTitle('Aula 1 — Seja um Programador')
    expect(firstVideo.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/S9uPNppGsGo',
    )

    await user.click(screen.getByRole('button', { name: /próxima aula/i }))

    await waitFor(() => {
      expect(screen.getByTestId('current-path').textContent).toBe(
        '/video-aula/python-vid-2',
      )
    })
    expect(progressMocks.completeLesson).toHaveBeenCalledWith('python-vid-1')
    const secondVideo = await screen.findByTitle('Aula 2 — Para que serve o Python?')
    expect(secondVideo.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/Mp0vhMDI7fA',
    )

    await user.click(screen.getByRole('link', { name: /aula anterior/i }))

    await waitFor(() => {
      expect(screen.getByTestId('current-path').textContent).toBe(
        '/video-aula/python-vid-1',
      )
    })
  })
})
