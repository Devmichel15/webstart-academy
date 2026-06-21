import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { ProgressProvider } from './contexts/ProgressContext.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { ToastContainer } from './components/ui/Toast.jsx'
import { AppLayout } from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Lesson from './pages/Lesson'
import Lab from './pages/Lab'
import Materials from './pages/Materials'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProgressProvider>
            <BrowserRouter>
              <ToastContainer />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Register />} />
                <Route path="/recuperar-senha" element={<ForgotPassword />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="cursos" element={<Courses />} />
                  <Route path="cursos/:courseId" element={<CourseDetail />} />
                  <Route path="aula/:lessonId" element={<Lesson />} />
                  <Route path="laboratorio" element={<Lab />} />
                  <Route path="materiais" element={<Materials />} />
                  <Route path="perfil" element={<Profile />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ProgressProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
