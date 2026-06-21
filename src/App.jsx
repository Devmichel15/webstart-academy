import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ProgressProvider } from './context/ProgressContext'
import { AppLayout } from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Lesson from './pages/Lesson'
import Lab from './pages/Lab'
import Materials from './pages/Materials'
import Profile from './pages/Profile'

export default function App() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="cursos" element={<Courses />} />
              <Route path="cursos/:courseId" element={<CourseDetail />} />
              <Route path="aula/:lessonId" element={<Lesson />} />
              <Route path="laboratorio" element={<Lab />} />
              <Route path="materiais" element={<Materials />} />
              <Route path="perfil" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProgressProvider>
    </ThemeProvider>
  )
}
