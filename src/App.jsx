import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { ProgressProvider } from './contexts/ProgressContext.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { ToastContainer } from './components/ui/Toast.jsx'
import { AppLayout } from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Journey from './pages/Journey'
import CourseDetail from './pages/CourseDetail'
import CourseCompletion from './pages/CourseCompletion'
import ModuleDetail from './pages/ModuleDetail'
import ModuleQuiz from './pages/ModuleQuiz'
import ModuleLab from './pages/ModuleLab'
import ModuleMiniProject from './pages/ModuleMiniProject'
import Lesson from './pages/Lesson'
import Lab from './pages/Lab'
import Materials from './pages/Materials'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Onboarding from './pages/Onboarding'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProgressProvider>
            <BrowserRouter>
              <ToastContainer />
              <Routes>
                <Route path="/u/:username" element={<PublicProfile />} />
                <Route path="/onboarding" element={<Onboarding />} />
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
                  <Route path="trilhas" element={<Journey />} />
                  <Route path="trilhas/:courseId" element={<CourseDetail />} />
                  <Route path="trilhas/:courseId/conclusao" element={<CourseCompletion />} />
                  <Route path="trilhas/:courseId/modulo/:moduleId" element={<ModuleDetail />} />
                  <Route path="trilhas/:courseId/modulo/:moduleId/quiz" element={<ModuleQuiz />} />
                  <Route path="trilhas/:courseId/modulo/:moduleId/lab" element={<ModuleLab />} />
                  <Route path="trilhas/:courseId/modulo/:moduleId/mini-projeto" element={<ModuleMiniProject />} />
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
