import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useProgress } from '../../hooks/useProgress.js'

export function FirstStepsGuard() {
  const { firstStepsDone, loading } = useProgress()
  const location = useLocation()

  if (loading) return <Outlet />

  if (firstStepsDone === false && location.pathname !== '/primeiros-passos') {
    return <Navigate to="/primeiros-passos" replace />
  }

  return <Outlet />
}
