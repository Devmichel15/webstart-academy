import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext.jsx'
import { useProgress } from '../../hooks/useProgress.js'
import {
  getAssessmentStatus,
  subscribeToAssessmentStatus,
} from '../../services/learningProfileService.js'
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
  const [assessmentState, setAssessmentState] = useState({
    user: null,
    completed: null,
    failed: false,
    loading: true,
  })
  const [modalDismissed, setModalDismissed] = useState(false)
  const statusRequest = useRef(0)
  const isCurrentUser = assessmentState.user === user
  const completed = isCurrentUser ? assessmentState.completed : null
  const assessmentFailed = isCurrentUser && assessmentState.failed
  const loading = Boolean(user) && (!isCurrentUser || assessmentState.loading)

  // 1. Allowlist route to prevent redirect loop
  const isAssessmentRoute = location.pathname === '/avaliacao-perfil'

  const isNewUser = xp === 0 && (completedLessons || []).length === 0
  // Só se pode afirmar "perfil vazio" se o perfil foi mesmo lido. Um erro ao
  // carregar deixa o defaultProfile (xp 0), que é indistinguível de perfil novo.
  const profileKnown = !progressLoading && !progressError

  useEffect(() => {
    if (!user?.id) return undefined

    let isMounted = true
    const requestId = ++statusRequest.current

    const unsubscribe = subscribeToAssessmentStatus(user.id, (status) => {
      if (!isMounted) return
      statusRequest.current += 1
      setAssessmentState({
        user,
        completed: status,
        failed: false,
        loading: false,
      })
    })

    getAssessmentStatus(user.id)
      .then((res) => {
        if (isMounted && statusRequest.current === requestId) {
          setAssessmentState({
            user,
            completed: res === true,
            failed: false,
            loading: false,
          })
        }
      })
      .catch((err) => {
        console.error('[LearningProfileGuard] Error checking assessment completion:', err)
        if (isMounted && statusRequest.current === requestId) {
          // Deixa `completed` em null: desconhecido ≠ por fazer.
          setAssessmentState({
            user,
            completed: null,
            failed: true,
            loading: false,
          })
        }
      })

    return () => {
      isMounted = false
      unsubscribe()
      statusRequest.current += 1
    }
  }, [user])

  const showModal =
    !loading &&
    !progressLoading &&
    Boolean(user) &&
    completed === false &&
    !assessmentFailed &&
    !isAssessmentRoute &&
    !isNewUser &&
    !modalDismissed &&
    sessionStorage.getItem('assessment_modal_dismissed') !== 'true'

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
      <Outlet
        context={{
          assessmentCompleted: completed,
          assessmentFailed,
          assessmentLoading: loading,
        }}
      />
      <AssessmentModal
        isOpen={showModal}
        onClose={() => setModalDismissed(true)}
      />
    </>
  )
}
