import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext.jsx'
import { useProgress } from '../../hooks/useProgress.js'
import { getAssessmentStatus } from '../../services/learningProfileService.js'
import { AssessmentModal } from '../assessment/AssessmentModal.jsx'

export function LearningProfileGuard() {
  const { user } = useAuthContext()
  // ProgressContext expõe os campos do perfil achatados (xp, completedLessons,
  // ...). Não existe uma chave `profile`, portanto desestruturá-la devolvia
  // sempre undefined e tornava `isNewUser` permanentemente false.
  const { xp, completedLessons, loading: progressLoading, error: progressError } = useProgress()
  const location = useLocation()

  // `completed` é tri-estado: null = ainda a verificar, true/false = resposta
  // definitiva. `assessmentFailed` separa "não está feito" de "não foi possível
  // verificar" — sem esta distinção, uma falha de rede era tratada como
  // onboarding por concluir e mandava o utilizador refazer o assessment.
  const [completed, setCompleted] = useState(null)
  const [assessmentFailed, setAssessmentFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // 1. Allowlist route to prevent redirect loop
  const isAssessmentRoute = location.pathname === '/avaliacao-perfil'

  const isNewUser = xp === 0 && (completedLessons || []).length === 0
  // Só se pode afirmar "perfil vazio" se o perfil foi mesmo lido. Um erro ao
  // carregar deixa o defaultProfile (xp 0), que é indistinguível de perfil novo.
  const profileKnown = !progressLoading && !progressError

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let isMounted = true
    setAssessmentFailed(false)
    getAssessmentStatus(user.id)
      .then((res) => {
        if (isMounted) {
          setCompleted(res === true)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('[LearningProfileGuard] Error checking assessment completion:', err)
        if (isMounted) {
          // Deixa `completed` em null: desconhecido ≠ por fazer.
          setAssessmentFailed(true)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [user, location.pathname])

  // Handle modal trigger for existing users
  useEffect(() => {
    if (
      loading ||
      progressLoading ||
      !user ||
      completed === true ||
      assessmentFailed ||
      isAssessmentRoute
    ) {
      setShowModal(false)
      return
    }

    const dismissed = sessionStorage.getItem('assessment_modal_dismissed') === 'true'

    if (!isNewUser && !dismissed && completed === false) {
      setShowModal(true)
    }
  }, [
    loading,
    progressLoading,
    user,
    completed,
    assessmentFailed,
    isNewUser,
    isAssessmentRoute,
  ])

  if (loading || progressLoading) {
    return <Outlet />
  }

  // 2. New user gate: if new user and assessment not completed and not on /avaliacao-perfil -> redirect
  //    Só redireciona com verificação E perfil ambos conhecidos: um erro não pode
  //    ser interpretado como "onboarding por fazer".
  if (
    !assessmentFailed &&
    profileKnown &&
    isNewUser &&
    completed === false &&
    !isAssessmentRoute
  ) {
    return <Navigate to="/avaliacao-perfil" replace />
  }

  return (
    <>
      <Outlet context={{ assessmentCompleted: completed, assessmentFailed }} />
      <AssessmentModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
