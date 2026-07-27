import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext.jsx'
import { useProgress } from '../../hooks/useProgress.js'
import { isAssessmentCompleted } from '../../services/learningProfileService.js'
import { AssessmentModal } from '../assessment/AssessmentModal.jsx'

export function LearningProfileGuard() {
  const { user } = useAuthContext()
  const { profile, loading: progressLoading } = useProgress()
  const location = useLocation()

  const [completed, setCompleted] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // 1. Allowlist route to prevent redirect loop
  const isAssessmentRoute = location.pathname === '/avaliacao-perfil'

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let isMounted = true
    isAssessmentCompleted(user.uid)
      .then((res) => {
        if (isMounted) {
          setCompleted(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('[LearningProfileGuard] Error checking assessment completion:', err)
        if (isMounted) {
          setCompleted(false)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [user, location.pathname])

  // Handle modal trigger for existing users
  useEffect(() => {
    if (loading || progressLoading || !user || completed === true || isAssessmentRoute) {
      setShowModal(false)
      return
    }

    const isNewUser = profile?.xp === 0 && (profile?.completedLessons || []).length === 0
    const dismissed = sessionStorage.getItem('assessment_modal_dismissed') === 'true'

    if (!isNewUser && !dismissed && completed === false) {
      setShowModal(true)
    }
  }, [loading, progressLoading, user, completed, profile, isAssessmentRoute])

  if (loading || progressLoading) {
    return <Outlet />
  }

  // Determine if user is new strictly by xp === 0 && completedLessons.length === 0
  const isNewUser = profile?.xp === 0 && (profile?.completedLessons || []).length === 0

  // 2. New user gate: if new user and assessment not completed and not on /avaliacao-perfil -> redirect
  if (isNewUser && completed === false && !isAssessmentRoute) {
    return <Navigate to="/avaliacao-perfil" replace />
  }

  return (
    <>
      <Outlet context={{ assessmentCompleted: completed }} />
      <AssessmentModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
