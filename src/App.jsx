import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { ProgressProvider } from "./contexts/ProgressContext.jsx";
import { InstallProvider } from "./contexts/InstallContext.jsx";
import { ProtectedRoute } from "./components/auth/ProtectedRoute.jsx";
import { FirstStepsGuard } from "./components/auth/FirstStepsGuard.jsx";
import { LearningProfileGuard } from "./components/auth/LearningProfileGuard.jsx";
import { AdminRoute } from "./components/auth/AdminRoute.jsx";
import { ToastContainer } from "./components/ui/Toast.jsx";
import { HomeGate } from "./pages/PublicHome.jsx";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import PrimeirosPassos from "./pages/PrimeirosPassos";
import AssessmentPage from "./pages/AssessmentPage";
import Journey from "./pages/Journey";
import CourseDetail from "./pages/CourseDetail";
import CourseCompletion from "./pages/CourseCompletion";
import ModuleDetail from "./pages/ModuleDetail";
import ModuleQuiz from "./pages/ModuleQuiz";
import ModuleLab from "./pages/ModuleLab";
import ModuleMiniProject from "./pages/ModuleMiniProject";
import Lesson from "./pages/Lesson";
import VideoLesson from "./pages/VideoLesson";
import Lab from "./pages/Lab";
import Materials from "./pages/Materials";
import Profile from "./pages/Profile";
import AIChat from "./pages/AIChat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import EmailPreferences from "./pages/EmailPreferences";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import { InstallPrompt } from "./components/pwa/InstallPrompt.jsx";
import InstallApp from "./pages/InstallApp.jsx";
import { supabase } from "./lib/supabase.js";

function AuthCallback() {
  const location = useLocation();
  const [status, setStatus] = useState(() =>
    new URLSearchParams(window.location.search).has("code")
      ? "loading"
      : "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const exchangedCodeRef = useRef(null);

  useEffect(() => {
    const code = new URLSearchParams(location.search).get("code");
    if (!code || exchangedCodeRef.current === code) return undefined;
    exchangedCodeRef.current = code;
    const exchangeCode = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href,
      );
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      url.searchParams.delete("error");
      url.searchParams.delete("error_code");
      url.searchParams.delete("error_description");
      window.history.replaceState(
        {},
        document.title,
        `${url.pathname}${url.search}${url.hash}`,
      );

      if (error) {
        console.error("[AuthCallback] code exchange failed:", error);
        setErrorMessage(
          "Não foi possível concluir o login com Google. Tenta novamente.",
        );
        setStatus("error");
        return;
      }
      setStatus("done");
    };

    exchangeCode();
    return undefined;
  }, [location.search]);

  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-canvas text-primary">
        A concluir o login...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-canvas p-6 text-center text-primary">
        <p role="alert">{errorMessage}</p>
      </div>
    );
  }

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProgressProvider>
            <InstallProvider>
              <BrowserRouter>
                <ToastContainer />
                <InstallPrompt />
                <AuthCallback />
                <Routes>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/registro" element={<Register />} />
                  <Route path="/recuperar-senha" element={<ForgotPassword />} />
                  <Route
                    path="/email-preferences"
                    element={<EmailPreferences />}
                  />

                  {/* Fullscreen Protected Route (No AppLayout / No Sidebar / 100% Viewport) */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <LearningProfileGuard />
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path="avaliacao-perfil"
                      element={<AssessmentPage />}
                    />
                  </Route>

                  {/* Home pública: visitantes veem a landing em "/", autenticados vão para a área interna */}
                  <Route element={<HomeGate />}>
                    <Route
                      element={
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route element={<LearningProfileGuard />}>
                        <Route path="instalar-app" element={<InstallApp />} />
                        <Route
                          path="primeiros-passos"
                          element={<PrimeirosPassos />}
                        />
                        <Route index element={<Dashboard />} />
                        <Route element={<FirstStepsGuard />}>
                          <Route path="trilhas" element={<Journey />} />
                          <Route
                            path="trilhas/:courseId"
                            element={<CourseDetail />}
                          />
                          <Route
                            path="trilhas/:courseId/conclusao"
                            element={<CourseCompletion />}
                          />
                          <Route
                            path="trilhas/:courseId/modulo/:moduleId"
                            element={<ModuleDetail />}
                          />
                          <Route
                            path="trilhas/:courseId/modulo/:moduleId/quiz"
                            element={<ModuleQuiz />}
                          />
                          <Route
                            path="trilhas/:courseId/modulo/:moduleId/lab"
                            element={<ModuleLab />}
                          />
                          <Route
                            path="trilhas/:courseId/modulo/:moduleId/mini-projeto"
                            element={<ModuleMiniProject />}
                          />
                          <Route path="aula/:lessonId" element={<Lesson />} />
                          <Route
                            path="video-aula/:lessonId"
                            element={<VideoLesson />}
                          />
                          <Route path="laboratorio" element={<Lab />} />
                          <Route path="materiais" element={<Materials />} />
                          <Route path="perfil" element={<Profile />} />
                          <Route path="chat" element={<AIChat />} />
                        </Route>
                      </Route>
                    </Route>
                  </Route>

                  <Route
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="admin/users" element={<AdminUsers />} />
                    <Route
                      path="admin/analytics"
                      element={<AdminAnalytics />}
                    />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </InstallProvider>
          </ProgressProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
